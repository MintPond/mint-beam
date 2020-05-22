'use strict';

const
    assert = require('assert'),
    MockBeamExplorerClient = require('./../mocks/class.MockBeamExplorerClient');

let client;

function globalBe() {
    client = new MockBeamExplorerClient();
}


describe('MockBeamExplorerClient', () => {

    describe('getStatus function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._getStatusResult = 'result';
            client.getStatus({
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._getStatusError = 'error';
            client.getStatus({
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('getBlock function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._getBlockResult = 'result';
            client.getBlock({
                id: 'id',
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._getBlockError = 'error';
            client.getBlock({
                id: 'id',
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('getBlockAt function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._getBlockAtResult = 'result';
            client.getBlockAt({
                height: 1,
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._getBlockAtError = 'error';
            client.getBlockAt({
                height: 1,
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('getBlockByKernel function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._getBlockByKernelResult = 'result';
            client.getBlockByKernel({
                id: 'id',
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._getBlockByKernelError = 'error';
            client.getBlockByKernel({
                id: 'id',
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('getBlocks function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._getBlocksResult = 'result';
            client.getBlocks({
                height: 1,
                count: 1,
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._getBlocksError = 'error';
            client.getBlocks({
                height: 1,
                count: 1,
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });
});