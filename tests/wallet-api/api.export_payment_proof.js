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

client.exportPaymentProof({
    txId: '2908437d7e654765aaa4ecf68af8f5c6',
    callback: (err, result) => {
        if (err)
            throw err;

        assert.strictEqual(typeof result.payment_proof, 'string');
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}