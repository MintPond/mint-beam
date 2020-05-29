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

client.getUTXO({
    callback: (err, utxoArr) => {
        if (err)
            throw err;

        assert.strictEqual(Array.isArray(utxoArr), true);
        utxoArr.forEach(utxo => {
            assert.strictEqual(typeof utxo.id, 'string');
            assert.strictEqual(typeof utxo.asset_id, 'number');
            assert.strictEqual(typeof utxo.amount, 'number');
            assert.strictEqual(typeof utxo.maturity, 'number');
            assert.strictEqual(typeof utxo.type, 'string');
            assert.strictEqual(typeof utxo.createTxId, 'string');
            assert.strictEqual(typeof utxo.spentTxId, 'string');
            assert.strictEqual(typeof utxo.status, 'number');
            assert.strictEqual(typeof utxo.status_string, 'string');
        });
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}