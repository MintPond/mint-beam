'use strict';

const
    http = require('http'),
    https = require('https'),
    precon = require('@mintpond/mint-precon'),
    pu = require('@mintpond/mint-utils').prototypes;


/**
 * Beam Explorer API client.
 * https://github.com/BeamMW/beam/wiki/Beam-Node-Explorer-API
 */
class BeamExplorerClient {

    /**
     * Constructor.
     *
     * @param args
     * @param args.host {string}
     * @param args.port {number}
     * @param [args.isSecure] {boolean}
     */
    constructor(args) {
        precon.string(args.host, 'string');
        precon.minMaxInteger(args.port, 1, 65535, 'port');
        precon.opt_boolean(args.isSecure, 'boolean');

        const _ = this;
        _._host = args.host;
        _._port = args.port;
        _._isSecure = !!args.isSecure;
    }


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

        _._get(`status`, callback);
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

        _._get(`block?hash=${id}`, callback);
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

        _._get(`block?height=${height}`, callback);
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

        _._get(`block?kernel=${id}`, callback);
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

        _._get(`blocks?height=${height}&n=${count}`, callback);
    }


    _get(path, callback) {
        const _ = this;

        const options = {
            host: _._host,
            port: _._port,
            path: `/${path}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = (_._isSecure ? https : http).request(options, (res) => {

            if (res.statusCode !== 200) {
                const error = new Error(res.statusMessage);
                error.statusCode = res.statusCode
                callback && callback(error);
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
            callback && callback(err);
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