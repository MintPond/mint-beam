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

client.walletStatus({
    txId: '',
    callback: (err, result) => {
        if (err)
            throw err;

        assert.strictEqual(typeof result.available, 'number');
        assert.strictEqual(typeof result.current_height, 'number');
        assert.strictEqual(typeof result.current_state_hash, 'string');
        assert.strictEqual(typeof result.difficulty, 'number');
        assert.strictEqual(typeof result.maturing, 'number');
        assert.strictEqual(typeof result.prev_state_hash, 'string');
        assert.strictEqual(typeof result.receiving, 'number');
        assert.strictEqual(typeof result.sending, 'number');
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}