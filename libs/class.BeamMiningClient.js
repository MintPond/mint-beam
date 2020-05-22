'use strict';

const
    EventEmitter = require('events'),
    net = require('net'),
    tls = require('tls'),
    precon = require('@mintpond/mint-precon'),
    TcpSocket = require('@mintpond/mint-socket').TcpSocket,
    JsonSocket = require('@mintpond/mint-socket').JsonSocket,
    mu = require('@mintpond/mint-utils'),
    pu = require('@mintpond/mint-utils').prototypes,
    beamDiff = require('./service.beamDiff');


/**
 * Beam mining API client.
 * https://github.com/BeamMW/beam/wiki/Beam-mining-protocol-API-(Stratum)
 */
class BeamMiningClient extends EventEmitter {

    /**
     * Constructor.
     *
     * @param args
     * @param args.host {string}
     * @param args.port {number}
     * @param args.apiKey {string}
     * @param [args.isSecure=false] {boolean}
     */
    constructor(args) {
        precon.string(args.host, 'host');
        precon.minMaxInteger(args.port, 1, 65535, 'port');
        precon.string(args.apiKey, 'apiKey');
        precon.opt_boolean(args.isSecure, 'isSecure');

        super();

        const _ = this;
        _._host = args.host;
        _._port = args.port;
        _._apiKey = args.apiKey;
        _._isSecure = !!args.isSecure;

        _._connectArgs = _.$createConnectArgs();
        _._socket = null;
        _._replyMap = new Map();
        _._currentJob = null;
        _._isConnected = false;
        _._connectTimeout = null;
    }


    /**
     * The name of the event emitted when a job is received.
     * @returns {string}
     */
    static get EVENT_JOB() { return 'job' }

    /**
     * The name of the event emitted when a reply is received.
     * @returns {string}
     */
    static get EVENT_RESULT() { return 'reply' }

    /**
     * The name of the event emitted when an unknown method is received from the Beam stratum.
     * @returns {string}
     */
    static get EVENT_UNKNOWN_METHOD() { return 'unknownMethod' }

    /**
     * The name of the event emitted when a socket error occurs.
     * @returns {string}
     */
    static get EVENT_SOCKET_ERROR() { return 'socketError' }

    /**
     * The name of the event emitted when the socket connection ends.
     * @returns {string}
     */
    static get EVENT_SOCKET_DISCONNECT() { return 'socketDisconnect' }


    /**
     * Get the most recent job received from the Beam stratum.
     * @returns {null|{
     *     id: string
     *     input: string
     *     height: number,
     *     difficulty: number
     * }}
     */
    get currentJob() { return this._currentJob; }

    /**
     * Determine if the client is currently connected or connecting to the mining node.
     * @returns {boolean}
     */
    get isConnected() { return this._isConnected; }

    /**
     * Get the default host.
     * @returns {string}
     */
    get defaultHost() { return this._host; }

    /**
     * Get the default port value.
     * @returns {number}
     */
    get defaultPort() { return this._port; }

    /**
     * Get the default API key value.
     * @returns {string}
     */
    get defaultApiKey() { return this._apiKey; }

    /**
     * Get the default secure connection value.
     * @returns {boolean}
     */
    get defaultIsSecure() { return this._isSecure; }

    /**
     * Get the current host value.
     * @returns {string}
     */
    get host() { return this._connectArgs.host; }

    /**
     * Get the current port value.
     * @returns {number}
     */
    get port() { return this._connectArgs.port; }

    /**
     * Get the current API key value.
     * @returns {string}
     */
    get apiKey() { return this._connectArgs.apiKey; }

    /**
     * Get the current secure connection value.
     * @returns {boolean}
     */
    get isSecure() { return this._connectArgs.isSecure; }


    /**
     * Connect to the Beam mining node.
     *
     * @param [callback] {function(err:*)}
     */
    connect(callback) {
        precon.opt_funct(callback, 'callback');

        const _ = this;

        if (_._isConnected)
            throw new Error('Already connected or connecting.');

        _._isConnected = true;
        _._connectArgs = _.$createConnectArgs();

        _.$connect(_._connectArgs, callback);
    }


    /**
     * Disconnect from Beam mining node.
     */
    disconnect() {
        const _ = this;

        _._isConnected = false;
        clearTimeout(_._connectTimeout);
        if (!_._socket)
            return;

        _._socket.destroy();
        _._socket = null;
    }


    /**
     * Submit share solution.
     *
     * @param args
     * @param args.beamJobIdHex {string}
     * @param args.nonceHex {string}
     * @param args.outputHex {string}
     * @param args.callback {function(err:*, result:{
     *     isAccepted: boolean,
     *     blockHash: null|string,
     *     error: null|string
     * })}
     */
    submitSolution(args) {
        precon.string(args.beamJobIdHex, 'beamJobIdHex');
        precon.string(args.nonceHex, 'nonceHex');
        precon.string(args.outputHex, 'outputHex');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const beamJobIdHex = args.beamJobIdHex;
        const nonceHex = args.nonceHex;
        const outputHex = args.outputHex;
        const callback = args.callback;

        if (_._socket === null) {
            callback(new Error('Not connected'), null);
            return;
        }

        _.$send({
            id: beamJobIdHex,
            method: 'solution',
            nonce: nonceHex,
            output: outputHex,
            jsonrpc: '2.0',
        }, (reply) => {
            // 1 = accepted
            // 3 = expired/stale
            if (reply.code === 1/*accepted*/) {
                callback(null, {
                    isAccepted: true,
                    blockHash: reply.blockhash,
                    error: null
                });
            }
            else {
                callback(null, {
                    isAccepted: false,
                    blockHash: null,
                    error: reply.description
                });
            }
        });
    }


    $createConnection(connectArgs, onConnectFn) {
        const host = connectArgs.host;
        const port = connectArgs.port;
        const isSecure = connectArgs.isSecure;

        return isSecure
            ? tls.connect(port, host, {}, onConnectFn)
            : net.connect(port, host, onConnectFn);
    }


    $createConnectArgs() {
        const _ = this;
        return {
            host: _._host,
            port: _._port,
            apiKey: _._apiKey,
            isSecure: _._isSecure,
            reconnectCount: 0
        };
    }


    $onError(ev) {
        const _ = this;
        _.emit(BeamMiningClient.EVENT_SOCKET_ERROR, ev);
    }


    $onDisconnect() {
        const _ = this;
        let shouldReconnect = false;
        let reconnectCallbackArr = [];
        let retryDelayMs = 0;
        _.emit(BeamMiningClient.EVENT_SOCKET_DISCONNECT, {
            ..._._connectArgs,
            /**
             * Reconnect to the mining node.
             * @param [callback] {function}
             *//**
             * Reconnect to the mining node.
             * @param [delayMs] {number}
             * @param [callback] {function}
             *//**
             * Reconnect to the mining node.
             * @param [args] {{host?:string,port?:number,apiKey?:string}}
             * @param [delayMs] {number}
             * @param [callback] {function}
             */
            reconnect(args, delayMs, callback) {

                if (mu.isFunction(args)) {
                    callback = args;
                    delayMs = 0;
                    args = null;
                }

                if (mu.isFunction(delayMs)) {
                    callback = delayMs;
                    delayMs = 0;
                }

                if (mu.isNumber(args))
                    delayMs = args;

                if (mu.isFunction(callback))
                    reconnectCallbackArr.push(callback);

                _._connectArgs = {
                    ..._.$createConnectArgs(),
                    ...args,
                    reconnectCount: _._connectArgs.reconnectCount
                };

                shouldReconnect = true;
                retryDelayMs = Math.max(retryDelayMs, delayMs || 0);
            }
        });

        _._socket = null;

        if (shouldReconnect) {
            _._connectArgs.reconnectCount++;
            _._isConnected = true;
            _._connectTimeout = setTimeout(() => {
                _.$connect(_._connectArgs, err => {
                    reconnectCallbackArr.forEach(callback => { callback(err) });
                });
            }, retryDelayMs);
        }
        else {
            for (const fnArr of _._replyMap.values()) {
                fnArr.forEach(fn => {
                    fn(new Error('Disconnected'));
                });
            }
            _._replyMap.clear();
            _._socket = null;
        }
    }


    $connect(connectArgs, callback) {

        const _ = this;

        clearTimeout(_._connectTimeout);

        const netSocket = _.$createConnection(connectArgs, () => {

            netSocket.off('error', onConnectError);

            _.$login(connectArgs.apiKey, (err) => {

                if (!err)
                    connectArgs.reconnectCount = 0;

                callback && callback(err);
                callback = null;
            });
        });

        netSocket.once('error', onConnectError);

        function onConnectError(err) {
            callback && callback(err);
            callback = null;
        }

        _._socket = new JsonSocket({ netSocket: netSocket });
        _._socket.on(TcpSocket.EVENT_DISCONNECT, _.$onDisconnect.bind(_));
        _._socket.on(TcpSocket.EVENT_ERROR, _.$onError.bind(_));
        _._socket.on(TcpSocket.EVENT_MESSAGE_IN, _._onMessage.bind(_));
    }


    $login(apiKey, callback) {

        const _ = this;
        _.$send({
            id: 'login',
            method: 'login',
            api_key: apiKey,
            jsonrpc: '2.0'
        }, (reply) => {
            if (reply.code === 0/*Success*/) {
                callback(null);
            }
            else {
                callback(new Error('Login failed'));
            }
        });
    }


    $send(data, callback) {
        precon.funct(callback);
        const _ = this;
        _._awaitResult(data.id, callback);
        _._socket.send(data);
    }


    _onMessage(ev) {

        const _ = this;
        const msg = ev.message;

        switch (msg.method) {

            case 'result':
                const callback = _._getCallback(msg.id);

                _.emit(BeamMiningClient.EVENT_RESULT, msg);

                if (callback) {
                    callback(msg);
                }
                else {
                    console.error(`No handler for reply found: ${JSON.stringify(msg)}`);
                }
                break;

            case 'job':
                _._currentJob = {
                    id: msg.id,
                    input: msg.input,
                    height: msg.height,
                    difficulty: beamDiff.unpack(msg.difficulty)
                };
                _.emit(BeamMiningClient.EVENT_JOB, _._currentJob);
                break;

            default:
                _.emit(BeamMiningClient.EVENT_UNKNOWN_METHOD, msg);
                break;
        }
    }


    _awaitResult(id, callback) {
        const _ = this;
        let fnArr = _._replyMap.get(id);
        if (!fnArr) {
            fnArr = [];
            _._replyMap.set(id, fnArr);
        }
        fnArr.push(callback);
    }


    _getCallback(id) {
        const _ = this;
        const fnArr = _._replyMap.get(id);
        if (!Array.isArray(fnArr))
            throw new Error(`No callback stored for message result ${id}`);

        const callback = fnArr.shift();
        if (fnArr.length === 0)
            _._replyMap.delete(id);

        return callback;
    }


    static get CLASS_ID() { return 'e4170352033f126173d39e325d2ed747bd139534f8fa153f6ce2c47d180072b1'; }
    static TEST_INSTANCE(BeamMiningClient) { return new BeamMiningClient({ host: '127.0.0.1', port: 1, apiKey: '', useTLS: false }); }
    static [Symbol.hasInstance](obj) {
        return pu.isInstanceOfById(obj, BeamMiningClient.CLASS_ID);
    }
}

module.exports = BeamMiningClient;