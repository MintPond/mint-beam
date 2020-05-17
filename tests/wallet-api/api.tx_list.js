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

client.txList({
    callback: (err, txList) => {
        if (err)
            throw err;

        assert.strictEqual(Array.isArray(txList), true);
        txList.forEach(entry => {
            assert.strictEqual(typeof entry.comment, 'string');
            assert.strictEqual(typeof entry.create_time, 'number');
            assert.strictEqual(typeof entry.failure_reason, 'string');
            assert.strictEqual(typeof entry.fee, 'number');
            assert.strictEqual(typeof entry.income, 'boolean');
            assert.strictEqual(typeof entry.receiver, 'string');
            assert.strictEqual(typeof entry.sender, 'string');
            assert.strictEqual(typeof entry.status, 'number');
            assert.strictEqual(typeof entry.status_string, 'string');
            assert.strictEqual(typeof entry.txId, 'string');
            assert.strictEqual(typeof entry.value, 'number');
        });
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}