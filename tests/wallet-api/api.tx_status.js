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

client.txStatus({
    txId: '4945297d30c44258b4619cc12f4240ac',
    callback: (err, result) => {
        if (err)
            throw err;

        assert.strictEqual(typeof result.asset_id, 'number');
        assert.strictEqual(typeof result.comment, 'string');
        assert.strictEqual(typeof result.confirmations, 'number');
        assert.strictEqual(typeof result.create_time, 'number');
        assert.strictEqual(typeof result.fee, 'number');
        assert.strictEqual(typeof result.height, 'height');
        assert.strictEqual(typeof result.income, 'boolean');
        assert.strictEqual(typeof result.kernel, 'kernel');
        assert.strictEqual(typeof result.receiver, 'receiver');
        assert.strictEqual(typeof result.sender, 'sender');
        assert.strictEqual(typeof result.status, 'number');
        assert.strictEqual(typeof result.status_string, 'string');
        assert.strictEqual(typeof result.txId, 'string');
        assert.strictEqual(typeof result.tx_type, 'number');
        assert.strictEqual(typeof result.tx_type_string, 'simple');
        assert.strictEqual(typeof result.value, 'number');
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}