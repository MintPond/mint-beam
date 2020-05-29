'use strict';

const
    assert = require('assert'),
    async = require('async'),
    fs = require('fs'),
    path = require('path'),
    BeamWalletClient = require('./../../libs/class.BeamWalletClient'),
    BeamAddressExpire = require('./../../libs/const.BeamAddressExpire');

const config = _getConfig().wallet;
const client = new BeamWalletClient({
    host: config.host,
    port: config.port
});

let address;

async.series([

    sCallback => {
        client.createAddress({
            expire: BeamAddressExpire.HOURS_24,
            comment: 'API test',
            callback: (err, addr) => {
                if (err)
                    throw err;

                address = addr;
                sCallback();
            }
        });
    },

    sCallback => {
        client.txSend({
            value: 2,
            fee: 100,
            address: address,
            comment: 'API test',
            callback: (err, result) => {
                if (err)
                    throw err;

                assert.strictEqual(typeof result.txId, 'string');
                sCallback();
            }
        });
    }
]);


function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}