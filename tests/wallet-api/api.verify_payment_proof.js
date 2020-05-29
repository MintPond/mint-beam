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

client.verifyPaymentProof({
    paymentProof: '020701b75d3e40b32ded0710c6873d2fb775a46ea2171604620a90ea9daab5b45490d9020d03bacf81491690a30d77707eee0c743e493a9489fdcf38375ee2d8c32ee666656b049cc99a3b7d029e706f803f0be38086b6ce319e013617b04ffedcb11ad96ca438f5977c0de4fce0d00cf6210f2b47abb45faf7c48ad6143814b18585e82376eff84c479f300735b3bc6174917b4634dd6467ae7fa9aef3c4e5b5b68efd276d62b88e11d2dfa',
    callback: (err, result) => {
        if (err)
            throw err;

        console.log(result);

        assert.strictEqual(typeof result.amount, 'number');
        assert.strictEqual(typeof result.asset_id, 'number');
        assert.strictEqual(typeof result.is_valid, 'boolean');
        assert.strictEqual(typeof result.kernel, 'string');
        assert.strictEqual(typeof result.receiver, 'string');
        assert.strictEqual(typeof result.sender, 'string');
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}