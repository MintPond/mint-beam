'use strict';

const
    assert = require('assert'),
    MockBeamWalletClient = require('./../mocks/class.MockBeamWalletClient'),
    BeamAddressExpire = require('./../libs/const.BeamAddressExpire');

let client;

function globalBe() {
    client = new MockBeamWalletClient();
}


describe('MockBeamWalletClient', () => {

    describe('createAddress function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._createAddressResult = 'result';
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: '',
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._createAddressError = 'error';
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: '',
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('validateAddress function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._validateAddressResult = 'result';
            client.validateAddress({
                address: 'address',
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._validateAddressError = 'error';
            client.validateAddress({
                address: 'address',
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('addrList function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._addrListResult = 'result';
            client.addrList({
                own: true,
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._addrListError = 'error';
            client.addrList({
                own: true,
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('deleteAddress function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._deleteAddressResult = 'result';
            client.deleteAddress({
                address: 'address',
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._deleteAddressError = 'error';
            client.deleteAddress({
                address: 'address',
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('editAddress function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._editAddressResult = 'result';
            client.editAddress({
                address: 'address',
                comment: '',
                expire: BeamAddressExpire.NEVER,
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._editAddressError = 'error';
            client.editAddress({
                address: 'address',
                comment: '',
                expire: BeamAddressExpire.NEVER,
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('txSend function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._txSendResult = 'result';
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._txSendError = 'error';
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('txSplit function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._txSplitResult = 'result';
            client.txSplit({
                coins: [10],
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._txSplitError = 'error';
            client.txSplit({
                coins: [10],
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('txCancel function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._txCancelResult = 'result';
            client.txCancel({
                txId: 'txId',
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._txCancelError = 'error';
            client.txCancel({
                txId: 'txId',
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('txStatus function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._txStatusResult = 'result';
            client.txStatus({
                txId: 'txId',
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._txStatusError = 'error';
            client.txStatus({
                txId: 'txId',
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('txList function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._txListResult = 'result';
            client.txList({
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._txListError = 'error';
            client.txList({
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('walletStatus function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._walletStatusResult = 'result';
            client.walletStatus({
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._walletStatusError = 'error';
            client.walletStatus({
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('getUTXO function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._getUTXOResult = 'result';
            client.getUTXO({
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._getUTXOError = 'error';
            client.getUTXO({
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('generateTxId function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._generateTxIdResult = 'result';
            client.generateTxId({
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._generateTxIdError = 'error';
            client.generateTxId({
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('exportPaymentProof function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._exportPaymentProofResult = 'result';
            client.exportPaymentProof({
                txId: 'txId',
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._exportPaymentProofError = 'error';
            client.exportPaymentProof({
                txId: 'txId',
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });

    describe('verifyPaymentProof function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._verifyPaymentProofResult = 'result';
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: (err, result) => {
                    assert.strictEqual(result, 'result');
                    done();
                }
            });
        });

        it('should mockup error', done => {
            client._verifyPaymentProofError = 'error';
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: (err) => {
                    assert.strictEqual(err, 'error');
                    done();
                }
            });
        });
    });
});