'use strict';

const
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    BeamExplorerClient = require('./../../libs/class.BeamExplorerClient');

const config = _getConfig().explorer;
const client = new BeamExplorerClient({
    host: config.host,
    port: config.port
});

client.getStatus({
    callback: (err, status) => {
        if (err)
            throw err;

        assert.strictEqual(typeof status.chainwork, 'string');
        assert.strictEqual(typeof status.hash, 'string');
        assert.strictEqual(typeof status.height, 'number');
        assert.strictEqual(typeof status.low_horizon, 'number');
        assert.strictEqual(typeof status.peers_count, 'number');
        assert.strictEqual(typeof status.timestamp, 'number');
    }
});

function _getConfig() {
    const json = fs.readFileSync(path.join(__dirname, '../config.json'));
    return JSON.parse(json.toString());
}