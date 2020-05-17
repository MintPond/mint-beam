'use strict';

const
    assert = require('assert'),
    http = require('http'),
    BeamWalletClient = require('./../libs/class.BeamWalletClient'),
    BeamAddressExpire = require('./../libs/const.BeamAddressExpire'),
    BeamTxStatus = require('./../libs/const.BeamTxStatus');

const HTTP_PORT = 8989;

let client;
let httpServer;
let apiReceiverFn;
let httpResponse = {};

function globalBe() {
    apiReceiverFn = () => {};
    client = new BeamWalletClient({
        host: '127.0.0.1',
        port: HTTP_PORT
    });
}


describe('BeamWalletClient', () => {

    before(done => {
        httpServer = http.createServer((req, res) => {
            req.on('data', chunk => {
                apiReceiverFn(req.method, JSON.parse(chunk.toString()));
            });
            req.on('end', function(){
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(httpResponse));
            });
        });
        httpServer.listen(HTTP_PORT, () => { done() });
    });

    after(() => {
        httpServer.close();
    });

    describe('createAddress function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'create_address');
                assert.strictEqual(typeof post.params, 'object')
                assert.strictEqual(post.params.expiration, BeamAddressExpire.HOURS_24);
                assert.strictEqual(post.params.comment, 'Test');
            };
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: () => { done(); }
            });
        });
    });

    describe('validateAddress function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.validateAddress({
                address: 'abc',
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.validateAddress({
                address: 'abc',
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'validate_address');
                assert.strictEqual(typeof post.params, 'object')
                assert.strictEqual(post.params.address, 'abc');
            };
            client.validateAddress({
                address: 'abc',
                callback: () => { done(); }
            });
        });
    });

    describe('addrList function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.addrList({
                own: true,
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.addrList({
                own: true,
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'addr_list');
                assert.strictEqual(typeof post.params, 'object')
                assert.strictEqual(post.params.own, true);
            };
            client.addrList({
                own: true,
                callback: () => { done(); }
            });
        });
    });

    describe('deleteAddress function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.deleteAddress({
                address: 'abc',
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.deleteAddress({
                address: 'abc',
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'delete_address');
                assert.strictEqual(typeof post.params, 'object')
                assert.strictEqual(post.params.address, 'abc');
            };
            client.deleteAddress({
                address: 'abc',
                callback: () => { done(); }
            });
        });
    });

    describe('editAddress function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.editAddress({
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.editAddress({
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'edit_address');
                assert.strictEqual(typeof post.params, 'object');
                assert.strictEqual(post.params.address, 'abc');
                assert.strictEqual(post.params.comment, 'Test');
                assert.strictEqual(post.params.expiration, BeamAddressExpire.NEVER);
            };
            client.editAddress({
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: () => { done(); }
            });
        });
    });

    describe('txSend function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'tx_send');
                assert.strictEqual(typeof post.params, 'object')
                assert.strictEqual(post.params.value, 1000);
                assert.strictEqual(post.params.fee, 100);
                assert.strictEqual(post.params.from, 'abcFrom');
                assert.strictEqual(post.params.address, 'abc');
                assert.strictEqual(post.params.comment, 'Test');
                assert.strictEqual(post.params.txId, 'tx');
            };
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: () => { done(); }
            });
        });
    });

    describe('txSplit function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.txSplit({
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.txSplit({
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'tx_split');
                assert.strictEqual(typeof post.params, 'object')
                assert.strictEqual(Array.isArray(post.params.coins), true);
                assert.strictEqual(post.params.coins.length, 3);
                assert.strictEqual(post.params.coins[0], 100);
                assert.strictEqual(post.params.coins[1], 1000);
                assert.strictEqual(post.params.coins[2], 10000);
                assert.strictEqual(post.params.fee, 100);
                assert.strictEqual(post.params.txId, 'tx');
            };
            client.txSplit({
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: () => { done(); }
            });
        });
    });

    describe('txCancel function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.txCancel({
                txId: 'tx',
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.txCancel({
                txId: 'tx',
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'tx_cancel');
                assert.strictEqual(typeof post.params, 'object')
                assert.strictEqual(post.params.txId, 'tx');
            };
            client.txCancel({
                txId: 'tx',
                callback: () => { done(); }
            });
        });
    });

    describe('txStatus function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.txStatus({
                txId: 'tx',
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.txStatus({
                txId: 'tx',
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'tx_status');
                assert.strictEqual(typeof post.params, 'object')
                assert.strictEqual(post.params.txId, 'tx');
            };
            client.txStatus({
                txId: 'tx',
                callback: () => { done(); }
            });
        });
    });

    describe('txList function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.txList({
                filter: {
                    status: BeamTxStatus.COMPLETED,
                    height: 100
                },
                skip: 0,
                count: 200,
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.txList({
                filter: {
                    status: BeamTxStatus.COMPLETED,
                    height: 100
                },
                skip: 0,
                count: 200,
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'tx_list');
                assert.strictEqual(typeof post.params, 'object');
                assert.strictEqual(typeof post.params.filter, 'object');
                assert.strictEqual(post.params.filter.status, BeamTxStatus.COMPLETED);
                assert.strictEqual(post.params.filter.height, 100);
                assert.strictEqual(post.params.skip, 0);
                assert.strictEqual(post.params.count, 200);
            };
            client.txList({
                filter: {
                    status: BeamTxStatus.COMPLETED,
                    height: 100
                },
                skip: 0,
                count: 200,
                callback: () => { done(); }
            });
        });
    });

    describe('walletStatus function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.walletStatus({
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.walletStatus({
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'wallet_status');
            };
            client.walletStatus({
                callback: () => { done(); }
            });
        });
    });

    describe('getUTXO function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.getUTXO({
                count: 100,
                skip: 0,
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.getUTXO({
                count: 100,
                skip: 0,
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'get_utxo');
                assert.strictEqual(typeof post.params, 'object');
                assert.strictEqual(post.params.count, 100);
                assert.strictEqual(post.params.skip, 0);
            };
            client.getUTXO({
                count: 100,
                skip: 0,
                callback: () => { done(); }
            });
        });
    });

    describe('generateTxId function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.generateTxId({
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.generateTxId({
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'generate_tx_id');
            };
            client.generateTxId({
                callback: () => { done(); }
            });
        });
    });

    describe('exportPaymentProof function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.exportPaymentProof({
                txId: 'tx',
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.exportPaymentProof({
                txId: 'tx',
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'export_payment_proof');
                assert.strictEqual(typeof post.params, 'object');
                assert.strictEqual(post.params.txId, 'tx');
            };
            client.exportPaymentProof({
                txId: 'tx',
                callback: () => { done(); }
            });
        });
    });

    describe('verifyPaymentProof function', () => {
        beforeEach(globalBe);

        it('should callback error correctly', done => {
            httpResponse = { error: { code: -1 }};
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: (err, result) => {
                    assert.strictEqual(err.code, -1);
                    assert.strictEqual(!!result, false);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { result: { a: 'bc' }};
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should post correct data to API server', done => {
            apiReceiverFn = (method, post) => {
                assert.strictEqual(method, 'POST');
                assert.strictEqual(post.jsonrpc, '2.0');
                assert.strictEqual(typeof post.id, 'number');
                assert.strictEqual(post.method, 'verify_payment_proof');
                assert.strictEqual(typeof post.params, 'object');
                assert.strictEqual(post.params.payment_proof, 'proof');
            };
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: () => { done(); }
            });
        });
    });
});