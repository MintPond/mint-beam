'use strict';

const
    EventEmitter = require('events'),
    net = require('net'),
    tls = require('tls'),
    precon = require('@mintpond/mint-precon'),
    TcpSocket = require('@mintpond/mint-socket').TcpSocket,
    JsonSocket = require('@mintpond/mint-socket').JsonSocket,
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
     * @param args.useTLS {boolean}
     */
    constructor(args) {
        precon.string(args.host, 'host');
        precon.minMaxInteger(args.port, 1, 65535, 'port');
        precon.string(args.apiKey, 'apiKey');
        precon.boolean(args.useTLS, 'useTLS');

        super();

        const _ = this;
        _._host = args.host;
        _._port = args.port;
        _._apiKey = args.apiKey;
        _._useTLS = args.useTLS;

        _._socket = null;
        _._replyMap = new Map();
        _._currentJob = null;
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
     * Connect to the Beam node stratum.
     *
     * @param [callback] {function()}
     */
    connect(callback) {
        precon.opt_funct(callback, 'callback');

        const _ = this;

        if (_._socket)
            throw new Error('Already connected.');

        const netSocket = _._createConnection(() => {
            _._login((err) => {
                callback && callback(err);
                callback = null;
            });
        });

        _._socket = new JsonSocket({ netSocket: netSocket });
        _._socket.on(TcpSocket.EVENT_DISCONNECT, _._onEnd.bind(_));
        _._socket.on(TcpSocket.EVENT_ERROR, _._onError.bind(_));
        _._socket.on(TcpSocket.EVENT_MESSAGE_IN, _._onMessage.bind(_));
    }


    /**
     * Disconnect from Beam node stratum.
     */
    disconnect() {
        const _ = this;
        if (!_._socket)
            return;

        _._socket.destroy();
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

        _._send({
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


    _createConnection(onConnectFn) {
        const _ = this;
        return _._useTLS
            ? tls.connect(_._port, _._host, {}, onConnectFn)
            : net.connect(_._port, _._host, onConnectFn);
    }


    _login(callback) {

        const _ = this;
        _._send({
            id: 'login',
            method: 'login',
            api_key: _._apiKey,
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


    _send(data, callback) {
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


    _onError(ev) {
        const _ = this;
        _.emit(BeamMiningClient.EVENT_SOCKET_ERROR, ev);
    }


    _onEnd() {
        const _ = this;

        _.emit(BeamMiningClient.EVENT_SOCKET_DISCONNECT);

        _._socket = null;
        for (const fnArr of _._replyMap.values()) {
            fnArr.forEach(fn => {
                fn('Disconnected');
            });
        }
        _._replyMap.clear();
        _._socket = null;
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