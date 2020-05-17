'use strict';

const
    fs = require('fs'),
    path = require('path'),
    BeamWalletClient = require('./../../libs/class.BeamWalletClient');

const config = _getConfig().wallet;
const client = new BeamWalletClient({
    host: config.host,
    port: config.port
});

client.verifyPaymentProof({
    paymentProof: '',
    callback: (err, result) => {
        if (err)
            throw err;

        assert.strictEqual(typeof result.is_valid, 'boolean');
        assert.strictEqual(typeof result.asset_id, 'number');
        assert.strictEqual(typeof result.sender, 'string');
        assert.strictEqual(typeof result.receiver, 'string');
        assert.strictEqual(typeof result.amount, 'amount');
        assert.strictEqual(typeof result.kernel, 'string');
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}