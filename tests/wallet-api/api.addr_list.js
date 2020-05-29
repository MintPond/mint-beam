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

client.addrList({
    own: true,
    callback: (err, addrList) => {
        if (err)
            throw err;

        assert.strictEqual(Array.isArray(addrList), true);
        addrList.forEach(entry => {
            assert.strictEqual(typeof entry.address, 'string');
            assert.strictEqual(typeof entry.category, 'string');
            assert.strictEqual(typeof entry.comment, 'string');
            assert.strictEqual(typeof entry.create_time, 'number');
            assert.strictEqual(typeof entry.duration, 'number');
            assert.strictEqual(typeof entry.expired, 'boolean');
            assert.strictEqual(typeof entry.identity, 'string');
            assert.strictEqual(typeof entry.own, 'boolean');

            // removed Beam 5.0
            //assert.strictEqual(typeof entry.ownIDBase64, 'string');

            // added Beam 5.0
            assert.strictEqual(typeof entry.own_id, 'number');
            assert.strictEqual(typeof entry.own_id_str, 'string');
        });
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}