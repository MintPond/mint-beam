'use strict';

const
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    BeamWalletClient = require('./../../libs/class.BeamWalletClient');

const config = _getConfig().wallet;
const client = new BeamWalletClient({
    host: config.host,
    port: config.port
});

client.validateAddress({
    address: '3d6b2f96b162a153fd6e2c1463f2ede8cee6e063f02cc0ef8ea69dac28965b4f938',
    callback: (err, result) => {
        if (err)
            throw err;

        assert.strictEqual(typeof result, 'object');
        assert.strictEqual(Object.keys(result).length, 2);
        assert.strictEqual(typeof result.is_mine, 'boolean');
        assert.strictEqual(result.is_valid, true);
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}