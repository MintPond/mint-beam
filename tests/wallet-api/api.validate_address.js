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
    address: '2f0b6996cd2b5647af074197136931afb49787bae1d5c820452c9d501bbb95e041a',
    callback: (err, result) => {

        console.log(err);
        console.log(result);

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