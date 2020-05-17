'use strict';

const
    async = require('async'),
    assert = require('assert'),
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
        client.deleteAddress({
            address: address,
            callback: (err, result) => {
                if (err)
                    throw err;

                assert.strictEqual(result, 'done');
                sCallback();
            }
        });
    }
]);


function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}