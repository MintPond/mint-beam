'use strict';

const
    assert = require('assert'),
    MockBeamMiningClient = require('./../mocks/class.MockBeamMiningClient');

let client;

function globalBe() {
    client = new MockBeamMiningClient();
}


describe('MockBeamMiningClient', () => {

    describe('connect function', () => {
        beforeEach(globalBe);

        it('should callback', done => {
            client.connect(done);
        });

        it('should mockup error', done => {
            client._connectError = 'error';
            client.connect((err) => {
                assert.strictEqual(err, 'error');
                done();
            });
        });
    });

    describe('disconnect function', () => {
        beforeEach(globalBe);

        it('should execute without error', () => {
            client.disconnect();
        });

        it('should emit EVENT_SOCKET_DISCONNECT event', done => {
            client.on(MockBeamMiningClient.EVENT_SOCKET_DISCONNECT, () => {
                done();
            });
            client.connect(() => {
                client.disconnect();
            });
        });
    });

    describe('submitSolution function', () => {
        beforeEach(globalBe);

        it('should mockup result', done => {
            client._submitSolutionResult = 'result';
            client.connect(() => {
                client.submitSolution({
                    beamJobId: '1',
                    nonceHex: 'nonce',
                    outputHex: 'output',
                    callback: (err, result) => {
                        assert.strictEqual(result, 'result');
                        done();
                    }
                });
            });
        });
    });

    describe('emitMockJob function', () => {
        beforeEach(globalBe);

        it('should emit EVENT_JOB', done => {
            client.on(MockBeamMiningClient.EVENT_JOB, () => {
                done();
            })
            client.emitMockJob({
                id: 'id',
                input: 'input',
                height: 0,
                difficulty: 0
            });
        });
    })
});