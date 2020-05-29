'use strict';

const
    assert = require('assert'),
    net = require('net'),
    TcpSocket = require('@mintpond/mint-socket').TcpSocket,
    JsonSocket = require('@mintpond/mint-socket').JsonSocket,
    BeamMiningClient = require('./../libs/class.BeamMiningClient');

const HOST = '127.0.0.1';
const PORT = 8988;
const API_KEY = '123'
const IS_SECURE = false;

let socket;
let client;
let server;
let apiReceiverFn;
let apiSendFn;

function globalBe() {
    apiReceiverFn = () => {};
    client = new BeamMiningClient({
        host: HOST,
        port: PORT,
        apiKey: API_KEY,
        isSecure: IS_SECURE
    });
}

function connectBe(done) {
    setupLogin();
    client.connect(() => { done() });
}

function globalAe() {
    client.removeAllListeners();
    client.disconnect();
    socket = null;
}

function setupLogin() {
    apiReceiverFn = (message) => {
        if (message.method === 'login') {
            apiSendFn({
                jsonrpc: '2.0',
                method: 'result',
                id: 'login',
                code: 0,
                description: 'success',
                forkheight: 10,
                forkheight2: 21
            });
        }
    };
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

        it('should return correct value from defaultHost property', () => {
            assert.strictEqual(client.defaultHost, HOST);
        });

        it('should return correct value from defaultPort property', () => {
            assert.strictEqual(client.defaultPort, PORT);
        });

        it('should return correct value from defaultApiKey property', () => {
            assert.strictEqual(client.defaultApiKey, API_KEY);
        });

        it('should return correct value from defaultIsSecure property', () => {
            assert.strictEqual(client.defaultIsSecure, IS_SECURE);
        });

        it('should return correct value from host property', () => {
            assert.strictEqual(client.host, HOST);
        });

        it('should return correct value from port property', () => {
            assert.strictEqual(client.port, PORT);
        });

        it('should return correct value from apiKey property', () => {
            assert.strictEqual(client.apiKey, API_KEY);
        });

        it('should return correct value from isSecure property', () => {
            assert.strictEqual(client.isSecure, IS_SECURE);
        });

        it('should return correct value from forkHeightOMap property', () => {
            assert.deepEqual(client.forkHeightOMap, {
                forkheight: 10,
                forkheight2: 21
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
                assert.strictEqual(message.api_key, API_KEY);
                assert.strictEqual(message.id, 'login');
                assert.strictEqual(message.jsonrpc, '2.0');
                assert.strictEqual(message.method, 'login');
                done();
            };
            client.connect();
        });

        it('should callback correctly', done => {
            setupLogin();
            client.connect((err) => {
                assert.strictEqual(!!err, false);
                done();
            });
        });

        it('should callback socket error correctly', done => {
            client._port = 2;
            client.connect((err) => {
                assert.strictEqual(!!err, true);
                done();
            });
        });

        it('should emit EVENT_SOCKET_ERROR if failed to connect to server', done => {
            client._port = 2;
            client.on(BeamMiningClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(!!ev.error, true);
                done();
            });
            client.connect();
        });

        it('should emit EVENT_SOCKET_DISCONNECT if failed to connect to server', done => {
            client._port = 2;
            client.on(BeamMiningClient.EVENT_SOCKET_DISCONNECT, ev => {
                assert.strictEqual(ev.host, HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.isSecure, IS_SECURE);
                assert.strictEqual(ev.reconnectCount, 0);
                done();
            });
            client.connect();
        });

        it('should reconnect when EVENT_SOCKET_DISCONNECT reconnect function is called', function (done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamMiningClient.EVENT_SOCKET_DISCONNECT, ev => {
                if (ev.reconnectCount === 0) {
                    ev.reconnect();
                }
                else if (ev.reconnectCount === 1) {
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.connect();
        });

        it('should callback correctly on reconnect when EVENT_SOCKET_DISCONNECT reconnect function is called', function (done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamMiningClient.EVENT_SOCKET_DISCONNECT, ev => {
                if (ev.reconnectCount === 0) {
                    ev.reconnect(() => {
                        done();
                    });
                }
                else if (ev.reconnectCount !== 1) {
                    throw new Error('Unexpected outcome');
                }
            });
            client.connect();
        });

        it('should modify connect args when EVENT_SOCKET_DISCONNECT reconnect function is called with args', function (done) {
            this.timeout(7000);
            client._port = 2;
            setupLogin();
            client.on(BeamMiningClient.EVENT_SOCKET_DISCONNECT, ev => {
                if (ev.reconnectCount === 0) {
                    ev.reconnect({
                        host: 'localhost',
                        port: PORT
                    }, (err) => {
                        assert.strictEqual(client.host, 'localhost');
                        assert.strictEqual(client.port, PORT);
                        assert.strictEqual(!!err, false);
                        done();
                    });
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.connect();
        });

        it('should correctly handle multiple reconnect calls from EVENT_SOCKET_DISCONNECT', function (done) {
            this.timeout(7000);
            client._port = 2;
            setupLogin();
            let callCount = 0;
            client.on(BeamMiningClient.EVENT_SOCKET_DISCONNECT, ev => {
                if (ev.reconnectCount === 0) {
                    ev.reconnect(() => {
                        callCount++;
                    });
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.on(BeamMiningClient.EVENT_SOCKET_DISCONNECT, ev => {
                if (ev.reconnectCount === 0) {
                    ev.reconnect({
                        port: PORT
                    }, () => {
                        callCount++;
                        assert.strictEqual(callCount, 2);
                        done();
                    });
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.connect();
        });

        it('should delay reconnect when EVENT_SOCKET_DISCONNECT reconnect function is called with delay (1)', function (done) {
            this.timeout(7000);
            client._port = 2;
            setupLogin();
            let startTimeMs = 0;
            client.on(BeamMiningClient.EVENT_SOCKET_DISCONNECT, ev => {
                if (ev.reconnectCount === 0) {
                    startTimeMs = Date.now();
                    ev.reconnect({
                        host: 'localhost'
                    }, 2000, () => {
                        const delayMs = Date.now() - startTimeMs;
                        assert.strictEqual(delayMs > 1950, true);
                        done();
                    });
                }
                else if (ev.reconnectCount !== 1) {
                    throw new Error('Unexpected outcome');
                }
            });
            client.connect();
        });

        it('should delay reconnect when EVENT_SOCKET_DISCONNECT reconnect function is called with delay (2)', function (done) {
            this.timeout(7000);
            client._port = 2;
            setupLogin();
            let startTimeMs = 0;
            client.on(BeamMiningClient.EVENT_SOCKET_DISCONNECT, ev => {
                if (ev.reconnectCount === 0) {
                    startTimeMs = Date.now();
                    ev.reconnect(2000, () => {
                        const delayMs = Date.now() - startTimeMs;
                        assert.strictEqual(delayMs > 1950, true);
                        done();
                    });
                }
                else if (ev.reconnectCount !== 1) {
                    throw new Error('Unexpected outcome');
                }
            });
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