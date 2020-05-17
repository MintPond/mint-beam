'use strict';

const
    http = require('http'),
    https = require('https'),
    precon = require('@mintpond/mint-precon'),
    mu = require('@mintpond/mint-utils'),
    pu = require('@mintpond/mint-utils').prototypes,
    BeamAddressExpire = require('./const.BeamAddressExpire'),
    BeamTxStatus = require('./const.BeamTxStatus');


/**
 * Beam wallet API client.
 * https://github.com/BeamMW/beam/wiki/Beam-wallet-protocol-API
 */
class BeamWalletClient {

    /**
     * Constructor.
     *
     * @param args
     * @param args.host {strings}
     * @param args.port {number}
     * @param [args.isSecure] {boolean}
     */
    constructor(args) {
        precon.string(args.host, 'host');
        precon.minMaxInteger(args.port, 1, 65535, 'port');
        precon.opt_boolean(args.isSecure, 'isSecure');

        const _ = this;
        _._host = args.host;
        _._port = args.port;
        _._isSecure = args.isSecure;
    }


    /**
     * @returns {string}
     */
    get host() { return this._host; }

    /**
     * @returns {port}
     */
    get port() { return this._port; }

    /**
     * @returns {boolean}
     */
    get isSecure() { return this._isSecure; }


    /**
     * Create a new address.
     *
     * @param args
     * @param args.expire {string} (BeamAddressExpire)
     * @param args.comment {string}
     * @param args.callback {function(err:*, address:string)}
     */
    createAddress(args) {
        precon.oneOf(args.expire, BeamAddressExpire.all, 'expire');
        precon.string(args.comment, 'comment');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const expire = args.expire;
        const comment = args.comment;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'create_address',
            params: {
                expiration: expire,
                comment: comment
            }
        }, callback);
    }


    /**
     * Validate an address.
     *
     * @param args
     * @param args.address {string}
     * @param args.callback (function(err:*, { is_mine:boolean, is_valid:boolean })}
     *
     */
    validateAddress(args) {
        precon.string(args.address, 'address');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const address = args.address;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'validate_address',
            params: {
                address: address
            }
        }, callback);
    }


    /**
     * Get a list of addresses.
     *
     * @param args
     * @param args.own {boolean}
     * @param args.callback {function(err:*, {
     *              address:string,
     *              category:string,
     *              comment:string,
     *              create_time:number,
     *              duration:number,
     *              expired:boolean,
     *              identity:string,
     *              own:boolean
     *              ownIDBase64:string }[] )}
     */
    addrList(args) {
        precon.boolean(args.own, 'own');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const own = args.own;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'addr_list',
            params: {
                own: own
            }
        }, callback);
    }


    /**
     * Delete an address from the wallet.
     *
     * @param args
     * @param args.address {string}
     * @param args.callback {function(err:*, reply:string)}
     */
    deleteAddress(args) {
        precon.string(args.address, 'address');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const address = args.address;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'delete_address',
            params: {
                address: address
            }
        }, callback);
    }


    /**
     * Edit details of an address.
     *
     * @param args
     * @param args.address {string}
     * @param args.comment {string}
     * @param args.expire {string} (BeamAddressExpire)
     * @param args.callback {function(err:*, reply:string)}
     */
    editAddress(args) {
        precon.string(args.address, 'address');
        precon.string(args.comment, 'comment');
        precon.oneOf(args.expire, BeamAddressExpire.all, 'expire');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const address = args.address;
        const comment = args.comment;
        const expire = args.expire;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'edit_address',
            params: {
                address: address,
                comment: comment,
                expiration: expire
            }
        }, callback);
    }


    /**
     * Send Beam coins.
     *
     * @param args
     * @param args.value {number} In groth/satoshi units.
     * @param [args.fee] {number} In groth/satoshi units.
     * @param [args.from] {string}
     * @param args.address {string}
     * @param args.comment {string}
     * @param [args.txId] {string}
     * @param args.callback {function(err:*, { txId:string })}
     */
    txSend(args) {
        precon.positiveInteger(args.value, 'value');
        precon.opt_positiveInteger(args.fee, 'fee');
        precon.opt_string(args.from, 'from');
        precon.string(args.address, 'address');
        precon.string(args.comment, 'comment');
        precon.opt_string(args.txId, 'txId');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const value = args.value;
        const fee = args.fee;
        const from = args.from;
        const address = args.address;
        const comment = args.comment;
        const txId = args.txId;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'tx_send',
            params: {
                value: value,
                fee: mu.isNumber(fee) ? fee : undefined,
                from: mu.isString(from) ? from : undefined,
                address: address,
                comment: comment,
                txId: mu.isString(txId) ? txId : undefined
            }
        }, callback);
    }


    /**
     * Creates a specific set of outputs with given values
     * .
     * @param args
     * @param args.coins {number[]} Output values in groth/satoshi units.
     * @param [args.fee] {number} In groth/satoshi units.
     * @param [args.txId] {string}
     */
    txSplit(args) {
        precon.arrayOf(args.coins, 'number', 'coins');
        precon.opt_positiveInteger(args.fee, 'fee');
        precon.opt_string(args.txId, 'txId');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const coins = args.coins;
        const fee = args.fee;
        const txId = args.txId;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'tx_split',
            params: {
                coins: coins,
                fee: mu.isNumber(fee) ? fee : undefined,
                txId: mu.isString(txId) ? txId : undefined
            }
        }, callback);
    }


    /**
     * Cancel a transaction.
     *
     * @param args
     * @param args.txId {string}
     * @param args.callback {function(err:*, result:boolean)}
     */
    txCancel(args) {
        precon.string(args.txId, 'txId');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const txId = args.txId;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'tx_cancel',
            params: {
                txId: txId
            }
        }, callback);
    }


    /**
     * Get status information for a transaction.
     *
     * @param args
     * @param args.txId {string}
     * @param args.callback {function(err:*, {
     *     txId: string,
     *     asset_id: number,
     * })}
     */
    txStatus(args) {
        precon.string(args.txId, 'txId');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const txId = args.txId;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'tx_status',
            params: {
                txId: txId
            }
        }, callback);
    }


    /**
     * Get a list of transactions.
     *
     * @param args
     * @param [args.filter]
     * @param [args.filter.status] {number} (BeamTxStatus)
     * @param [args.filter.height] {number}
     * @param [args.skip] {number}
     * @param [args.count] {number}
     * @param args.callback {function(err:*, {
     *      comment: string,
     *      creature_time: number,
     *      failure_reason: string,
     *      fee: number,
     *      income: boolean,
     *      receiver: string,
     *      sender: string,
     *      status: number,
     *      status_string: string,
     *      txId: string,
     *      value: number
     * }[] )}
     */
    txList(args) {
        precon.opt_obj(args.filter, 'filter');
        args.filter && precon.opt_oneOf(args.filter.status, BeamTxStatus.all, 'filter.status');
        args.filter && precon.opt_positiveInteger(args.filter.height, 'filter.height');
        precon.opt_positiveInteger(args.skip, 'skip');
        precon.opt_positiveInteger(args.count, 'count');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const filter = args.filter;
        const skip = args.skip;
        const count = args.count;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'tx_list',
            params: {
                filter: filter,
                skip: skip || 0,
                count: mu.isNumber(count) ? count : undefined
            }
        }, callback);
    }


    /**
     * Get wallet status information.
     *
     * @param args
     * @param args.callback {function(err:*, {
     *     available: number,
     *     current_height: number,
     *     current_state_hash: string,
     *     difficulty: number,
     *     maturing: number,
     *     prev_state_hash: string,
     *     receiving: number,
     *     sending: number
     * })}
     */
    walletStatus(args) {
        precon.funct(args.callback, 'callback');

        const _ = this;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'wallet_status'
        }, callback);
    }


    /**
     * Get list of UTXO's
     *
     * @param args
     * @param [args.count] {number}
     * @param [args.skip] {number}
     * @param args.callback {function(err:*, {
     *     id: number,
     *     asset_id: number,
     *     amount: number,
     *     maturity: 60,
     *     type: string,
     *     createTxId: string,
     *     spentTxId: string,
     *     status: number,
     *     status_string: string
     * }[] )}
     */
    getUTXO(args) {
        precon.opt_positiveInteger(args.count, 'count');
        precon.opt_positiveInteger(args.skip, 'skip');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const count = args.count;
        const skip = args.skip;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'get_utxo',
            params: {
                count: mu.isNumber(count) ? count : undefined,
                skip: skip || 0
            }
        }, callback);
    }


    /**
     * Pre-generate a transaction ID.
     *
     * @param args
     * @param args.callback {function(err:*, txId:string)}
     */
    generateTxId(args) {
        precon.funct(args.callback, 'callback');

        const _ = this;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'generate_tx_id'
        }, callback);
    }


    /**
     * Exports payment proof for given txId.
     *
     * @param args
     * @param args.txId {string}
     * @param args.callback {function(err:*, { payment_proof:string })}
     */
    exportPaymentProof(args) {
        precon.string(args.txId, 'txId');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const txId = args.txId;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'export_payment_proof',
            params: {
                txId: txId
            }
        }, callback);
    }


    /**
     * Verifies payment_proof
     *
     * @param args
     * @param args.paymentProof {string}
     * @param args.callback {function(err:*, {
     *     is_valid: boolean,
     *     asset_id: number,
     *     sender: string,
     *     receiver: string,
     *     amount: number,
     *     kernel: string
     * })}
     */
    verifyPaymentProof(args) {
        precon.string(args.paymentProof, 'paymentProof');
        precon.funct(args.callback, 'callback');

        const _ = this;
        const paymentProof = args.paymentProof;
        const callback = args.callback;

        _._post({
            jsonrpc: '2.0',
            id: 1,
            method: 'verify_payment_proof',
            params: {
                payment_proof: paymentProof
            }
        }, callback);
    }


    _post(reqObj, callback) {

        const _ = this;

        const data = JSON.stringify(reqObj);

        const options = {
            host: _._host,
            port: _._port,
            path: '/api/wallet',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
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
                callback && callback(parsed.error ? {
                    ...parsed.error,
                    toString() { return `ERROR: ${parsed.error.code}: ${parsed.error.message} ${parsed.error.data}`},
                    toJSON() {
                        return {
                            ...parsed.error,
                            host: _._host,
                            port: _._port,
                            req: reqObj
                        };
                    }
                } : null, parsed.result);
                callback = null;
            });
        });

        req.on('error', err => {
            callback && callback(err);
            callback = null;
        });

        req.write(data);
        req.end();
    }


    static get CLASS_ID() { return '3dbe9d451fb3fb7fde288e73b9ac4a737ac8bd8fd872d2fa4ddf11cb44a79c5b'; }
    static TEST_INSTANCE(BeamWalletClient) { return new BeamWalletClient({ host: '127.0.0.1', port: 1 }); }
    static [Symbol.hasInstance](obj) {
        return pu.isInstanceOfById(obj, BeamWalletClient.CLASS_ID);
    }
}

module.exports = BeamWalletClient;