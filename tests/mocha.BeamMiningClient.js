'use strict';

const
    assert = require('assert'),
    net = require('net'),
    TcpSocket = require('@mintpond/mint-socket').TcpSocket,
    JsonSocket = require('@mintpond/mint-socket').JsonSocket,
    BeamMiningClient = require('./../libs/class.BeamMiningClient');

const PORT = 8988;

let socket;
let client;
let server;
let apiReceiverFn;
let apiSendFn;

function globalBe() {
    apiReceiverFn = () => {};
    client = new BeamMiningClient({
        host: '127.0.0.1',
        port: PORT,
        apiKey: '123',
        useTLS: false
    });
}

function connectBe(done) {
    apiReceiverFn = (message) => {
        if (message.id === 'login') {
            apiSendFn({
                id: 'login',
                jsonrpc: '2.0',
                method: 'result',
                code: 0,
                description: 'success'
            });
        }
    };
    client.connect(() => { done() });
}

function globalAe() {
    client.disconnect();
    socket = null;
}


describe('BeamStratumClient', () => {

    before(done => {
        server = net.createServer(netSocket => {
            socket = new JsonSocket({ netSocket: netSocket });
            socket.on(TcpSocket.EVENT_MESSAGE_IN, ev => {
                apiReceiverFn(ev.message);
            });
            apiSendFn = function(message) {
                socket.send(message);
            };
        });
        server.listen(PORT, () => { done() });
    });

    after(() => {
        server.close();
    });

    context('properties', () => {
        beforeEach(globalBe);
        beforeEach(connectBe);
        afterEach(globalAe);

        it('should return correct value from currentJob property', () => {
            assert.strictEqual(client.currentJob, null);
        });

        it('should return correct value from currentJob property after receiving a job', done => {
            client.on(BeamMiningClient.EVENT_JOB, () => {
                const job = client.currentJob;
                assert.strictEqual(job.id, '2');
                assert.strictEqual(job.input, 'FF');
                assert.strictEqual(job.height, 10);
                assert.strictEqual(job.difficulty, 2/*unpacked*/)
                done();
            });
            apiSendFn({
                jsonrpc: '2.0',
                method: 'job',
                id: '2',
                input: 'FF',
                height: 10,
                difficulty: 16777216/*packed*/
            });
        });
    });

    describe('connect function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

        it('should connect to stratum server', done => {
            client.connect();
            setTimeout(() => {
                assert.strictEqual(!!socket, true);
                done();
            }, 10);
        });

        it('should login to stratum server', done => {
            apiReceiverFn = (message) => {
                assert.strictEqual(message.api_key, '123');
                assert.strictEqual(message.id, 'login');
                assert.strictEqual(message.jsonrpc, '2.0');
                assert.strictEqual(message.method, 'login');
                done();
            };
            client.connect();
        });
    });

    describe('submitSolution function', () => {
        beforeEach(globalBe);
        beforeEach(connectBe);
        afterEach(globalAe);

        it('should send correct data to stratum server', done => {
            apiReceiverFn = (message) => {
                assert.strictEqual(message.id, '1');
                assert.strictEqual(message.jsonrpc, '2.0');
                assert.strictEqual(message.method, 'solution');
                assert.strictEqual(message.nonce, 'FFFFFFFFFFFF')
                assert.strictEqual(message.output, 'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE');

                apiSendFn({
                    jsonrpc: '2.0',
                    method: 'result',
                    id: '1',
                    code: '1'
                });
            };
            client.submitSolution({
                beamJobIdHex: '1',
                nonceHex: 'FFFFFFFFFFFF',
                outputHex: 'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
                callback: () => {
                    done();
                }
            });
        });
    });

    context('events', () => {
        beforeEach(globalBe);
        beforeEach(connectBe);
        afterEach(globalAe);

        it('should emit EVENT_JOB when a new job is received', done => {
            client.on(BeamMiningClient.EVENT_JOB, job => {
                assert.strictEqual(job.id, '2');
                assert.strictEqual(job.input, 'FF');
                assert.strictEqual(job.height, 10);
                assert.strictEqual(job.difficulty, 2/*unpacked*/)
                done();
            });
            apiSendFn({
                jsonrpc: '2.0',
                method: 'job',
                id: '2',
                input: 'FF',
                height: 10,
                difficulty: 16777216/*packed*/
            });
        });

        it('should emit EVENT_RESULT when a result is received', done => {
            client.on(BeamMiningClient.EVENT_RESULT, result => {
                assert.strictEqual(result.jsonrpc, '2.0')
                assert.strictEqual(result.method, 'result');
                assert.strictEqual(result.id, '2');
                assert.strictEqual(result.some_val, 'FF');
                done();
            });
            client._replyMap.set('2', [() => {}]);
            apiSendFn({
                jsonrpc: '2.0',
                method: 'result',
                id: '2',
                some_val: 'FF'
            });
        });

        it('should emit EVENT_UNKNOWN_METHOD when a message with unimplemented method is received', done => {
            client.on(BeamMiningClient.EVENT_UNKNOWN_METHOD, msg => {
                assert.strictEqual(msg.jsonrpc, '2.0')
                assert.strictEqual(msg.method, 'new_method');
                assert.strictEqual(msg.id, '2');
                assert.strictEqual(msg.some_val, 'FF');
                done();
            });
            client._replyMap.set('2', [() => {}]);
            apiSendFn({
                jsonrpc: '2.0',
                method: 'new_method',
                id: '2',
                some_val: 'FF'
            });
        });

        it('should emit EVENT_SOCKET_ERROR when a socket error occurs', done => {
            client.on(BeamMiningClient.EVENT_SOCKET_ERROR, msg => {
                assert.strictEqual(msg.error, 'error');
                done();
            });
            client._socket.$onSocketError('error');
        });

        it('should emit EVENT_SOCKET_DISCONNECT when socket disconnects', done => {
            client.on(BeamMiningClient.EVENT_SOCKET_DISCONNECT, () => {
                done();
            });
            client.disconnect();
        });
    });

});