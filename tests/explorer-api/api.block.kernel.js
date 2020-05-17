'use strict';

const
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    BeamExplorerClient = require('./../../libs/class.BeamExplorerClient');

const TESTNET_KERNEL_ID = '2c4a5d0806dc86689b86e1cff70ce3789bef30335e436138b2ab452f1d63204f';

const config = _getConfig().explorer;
const client = new BeamExplorerClient({
    host: config.host,
    port: config.port
});

client.getBlockByKernel({
    id: TESTNET_KERNEL_ID,
    callback: (err, block) => {
        if (err)
            throw err;

        assert.strictEqual(typeof block.chainwork, 'string');
        assert.strictEqual(typeof block.difficulty, 'number');
        assert.strictEqual(typeof block.found, 'boolean');
        assert.strictEqual(typeof block.hash, 'string');
        assert.strictEqual(typeof block.height, 'number');
        assert.strictEqual(Array.isArray(block.inputs), true);

        assert.strictEqual(Array.isArray(block.kernels), true);
        block.kernels.forEach(kernel => {
            assert.strictEqual(typeof kernel.excess, 'string');
            assert.strictEqual(typeof kernel.fee, 'number');
            assert.strictEqual(typeof kernel.id, 'string');
            assert.strictEqual(typeof kernel.maxHeight, 'number');
            assert.strictEqual(typeof kernel.minHeight, 'number');
        });

        assert.strictEqual(Array.isArray(block.outputs), true);
        block.outputs.forEach(out => {
            assert.strictEqual(typeof out.coinbase, 'boolean');
            assert.strictEqual(typeof out.commitment, 'string');
            assert.strictEqual(typeof out.incubation, 'number');
            assert.strictEqual(typeof out.maturity, 'number');
        });

        assert.strictEqual(typeof block.prev, 'string');
        assert.strictEqual(typeof block.subsidy, 'number');
        assert.strictEqual(typeof block.timestamp, 'number');
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}