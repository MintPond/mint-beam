'use strict';

const
    EventEmitter = require('events'),
    http = require('http'),
    https = require('https'),
    precon = require('@mintpond/mint-precon'),
    pu = require('@mintpond/mint-utils').prototypes;


/**
 * Beam Explorer API client.
 * https://github.com/BeamMW/beam/wiki/Beam-Node-Explorer-API
 */
class BeamExplorerClient extends EventEmitter {

    /**
     * Constructor.
     *
     * @param args
     * @param args.host {string}
     * @param args.port {number}
     * @param [args.timeout=15] {number}
     * @param [args.isSecure=false] {boolean}
     */
    constructor(args) {
        precon.string(args.host, 'string');
        precon.minMaxInteger(args.port, 1, 65535, 'port');
        precon.opt_positiveNumber(args.timeout, 'timeout');
        precon.opt_boolean(args.isSecure, 'boolean');

        super();

        const _ = this;
        _._host = args.host;
        _._port = args.port;
        _._timeout = args.timeout || 15;
        _._isSecure = !!args.isSecure;
    }


    /**
     * The name of the event emitted when an error occurs.
     * @returns {string}
     */
    static get EVENT_SOCKET_ERROR() { return 'socketError' }


    /**
     * The name of the event emitted when the API server responds with a status code other than 200.
     * @returns {string}
     */
    static get EVENT_API_ERROR() { return 'apiError' }


    /**
     * Get the host value.
     * @returns {string}
     */
    get host() { return this._host; }

    /**
     * Get the port value.
     * @returns {number}
     */
    get port() { return this._port; }

    /**
     * Get the timeout value.
     * @returns {number}
     */
    get timeout() { return this._timeout; }

    /**
     * Get the secure connection value.
     * @returns {boolean}
     */
    get isSecure() { return this._isSecure; }


    /**
     * Get current blockchain status.
     *
     * @param args
     * @param args.callback {function(err:*, {
     *     chainwork: string,
     *     hash: string,
     *     height: number,
     *     low_horizon: number,
     *     peers_count: number,
     *     timestamp: number
     * })}
     */
    getStatus(args) {
        precon.funct(args.callback, 'callback');

        const _ = this;
        const callback = args.callback;

        _._get(`status`, _.$createConnectArgs(), callback);
    }


    /**
     * Get block info by block ID.
     *
     * @param args
     * @param args.id {string}
     * @param args.callback {function(err:*, {
     *     chainwork: string,
     *     difficulty: number,
     *     found: boolean,
     *     hash: string,
     *     height: number,
     *     inputs: [],
     *     kernels: {
     *         excess: string,
     *         fee: number,
     *         id: string,
     *         maxHeight: number,
     *         minHeight: number
     *     }[],
     *     outputs: {
     *         coinbase: boolean,
     *         commitment: string,
     *         incubation: number,
     *         maturity: number
     *     }[],
     *     prev: string,
     *     subsidy: number,
     *     timestamp: number
     * })}
     */
    getBlock(args) {
        precon.string(args.id, 'id');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const id = args.id;
        const callback = args.callback;

        _._get(`block?hash=${id}`, _.$createConnectArgs(), callback);
    }


    /**
     * Get block info by block height.
     *
     * @param args
     * @param args.id {string}
     * @param args.callback {function(err:*, {
     *     chainwork: string,
     *     difficulty: number,
     *     found: boolean,
     *     hash: string,
     *     height: number,
     *     inputs: [],
     *     kernels: {
     *         excess: string,
     *         fee: number,
     *         id: string,
     *         maxHeight: number,
     *         minHeight: number
     *     }[],
     *     outputs: {
     *         coinbase: boolean,
     *         commitment: string,
     *         incubation: number,
     *         maturity: number
     *     }[],
     *     prev: string,
     *     subsidy: number,
     *     timestamp: number
     * })}
     */
    getBlockAt(args) {
        precon.positiveInteger(args.height, 'height');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const height = args.height;
        const callback = args.callback;

        _._get(`block?height=${height}`, _.$createConnectArgs(), callback);
    }


    /**
     * Get block info by kernel ID.
     *
     * @param args
     * @param args.id {string}
     * @param args.callback {function(err:*, {
     *     chainwork: string,
     *     difficulty: number,
     *     found: boolean,
     *     hash: string,
     *     height: number,
     *     inputs: [],
     *     kernels: {
     *         excess: string,
     *         fee: number,
     *         id: string,
     *         maxHeight: number,
     *         minHeight: number
     *     }[],
     *     outputs: {
     *         coinbase: boolean,
     *         commitment: string,
     *         incubation: number,
     *         maturity: number
     *     }[],
     *     prev: string,
     *     subsidy: number,
     *     timestamp: number
     * })}
     */
    getBlockByKernel(args) {
        precon.string(args.id, 'id');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const id = args.id;
        const callback = args.callback;

        _._get(`block?kernel=${id}`, _.$createConnectArgs(), callback);
    }


    /**
     * Get multiple blocks starting at a height and advancing upwards by a specified count.
     *
     * @param args
     * @param args.height {number}
     * @param args.count {number} Minimum count is 1. Maximum count is 1500.
     * @param args.callback {function(err:*, {
     *     chainwork: string,
     *     difficulty: number,
     *     found: boolean,
     *     hash: string,
     *     height: number,
     *     inputs: [],
     *     kernels: {
     *         excess: string,
     *         fee: number,
     *         id: string,
     *         maxHeight: number,
     *         minHeight: number
     *     }[],
     *     outputs: {
     *         coinbase: boolean,
     *         commitment: string,
     *         incubation: number,
     *         maturity: number
     *     }[],
     *     prev: string,
     *     subsidy: number,
     *     timestamp: number
     * }[] )}
     */
    getBlocks(args) {
        precon.positiveInteger(args.height, 'height');
        precon.minMaxInteger(args.count, 1, 1500, 'count');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const height = args.height;
        const count = args.count;
        const callback = args.callback;

        _._get(`blocks?height=${height}&n=${count}`, _.$createConnectArgs(), callback);
    }


    $createConnectArgs() {
        const _ = this;
        return {
            host: _._host,
            port: _._port,
            timeout: _._timeout,
            isSecure: _._isSecure,
            retryCount: 0
        };
    }


    $createHttpOptions(connectArgs, path) {
        const host = connectArgs.host;
        const port = connectArgs.port;
        const timeout = connectArgs.timeout;

        return {
            host: host,
            port: port,
            path: `/${path}`,
            method: 'GET',
            timeout: timeout * 1000,
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }


    $handleApiError(res, path, connectArgs, callback) {
        const _ = this;

        const error = new Error(res.statusMessage);
        error.statusCode = res.statusCode

        let shouldRetry = false;
        let retryDelayMs = 0;
        const ev = {
            ...connectArgs,
            get error() { return error },
            get statusCode() { return res.statusCode },
            get path() { return path },
            get res() { return res },
            /**
             * Retry failed method.
             * @param [args] {{host?:string,port?:number,timeout?:number,isSecure?:boolean}}
             * @param [delayMs] {number}
             */
            retry: (args, delayMs) => {
                precon.opt_obj(args, 'args');
                precon.opt_positiveInteger(delayMs, 'delayMs');

                connectArgs = {
                    ..._.$createConnectArgs(),
                    ...args
                };

                shouldRetry = true;
                retryDelayMs = Math.max(retryDelayMs, delayMs || 0);
            }
        };
        _.emit(BeamExplorerClient.EVENT_API_ERROR, ev);

        if (shouldRetry) {
            connectArgs.retryCount++;
            setTimeout(() => {
                _._get(path, connectArgs, callback);
            }, retryDelayMs);
        }
        else {
            callback(error);
        }
    }


    $handleSocketError(err, path, connectArgs, callback) {
        const _ = this;
        let shouldRetry = false;
        let retryDelayMs = 0;
        const ev = {
            ...connectArgs,
            get error() { return err },
            get path() { return path },
            /**
             * Retry failed method.
             * @param [args] {{host?:string,port?:number,timeout?:number,isSecure?:boolean}}
             * @param [delayMs] {number}
             */
            retry: (args, delayMs) => {
                precon.opt_obj(args, 'args');
                precon.opt_positiveInteger(delayMs, 'delayMs');

                connectArgs = {
                    ..._.$createConnectArgs(),
                    ...args
                };

                shouldRetry = true;
                retryDelayMs = Math.max(retryDelayMs, delayMs || 0);
            }
        };
        _.emit(BeamExplorerClient.EVENT_SOCKET_ERROR, ev);

        if (shouldRetry) {
            connectArgs.retryCount++;
            setTimeout(() => {
                _._get(path, connectArgs, callback);
            }, retryDelayMs);
        }
        else {
            callback(err);
        }
    }


    _get(path, connectArgs, callback) {
        const _ = this;
        const isSecure = connectArgs.isSecure;
        const options = _.$createHttpOptions(connectArgs, path);

        const req = (isSecure ? https : http).request(options, (res) => {

            if (res.statusCode !== 200) {
                callback && _.$handleApiError(res, path, connectArgs, callback);
                callback = null;
                return;
            }

            res.setEncoding('utf8');
            res.on('data', chunk => {
                const json = chunk.toString();
                const parsed = JSON.parse(json);
                callback && callback(null, parsed);
                callback = null;
            });
        });

        req.on('error', err => {
            callback && _.$handleSocketError(err, path, connectArgs, callback);
            callback = null;
        });

        req.end();
    }


    static get CLASS_ID() { return 'e46c7e22bdc1214deccc6c185d47e2d4e1decaa4206509ee41c469250b223960'; }
    static TEST_INSTANCE(BeamExplorerClient) { return new BeamExplorerClient({ host: '127.0.0.1', port: 1 }); }
    static [Symbol.hasInstance](obj) {
        return pu.isInstanceOfById(obj, BeamExplorerClient.CLASS_ID);
    }
}

module.exports = BeamExplorerClient;