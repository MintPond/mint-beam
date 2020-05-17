'use strict';

const
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

client.createAddress({
    expire: BeamAddressExpire.HOURS_24,
    comment: 'API test',
    callback: (err, address) => {
        if (err)
            throw err;

        assert.strictEqual(typeof address, 'string');
        assert.strictEqual(address.length, 67);
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}