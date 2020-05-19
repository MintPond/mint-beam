'use strict';

const
    assert = require('assert'),
    http = require('http'),
    BeamExplorerClient = require('./../libs/class.BeamExplorerClient');

const HTTP_HOST = '127.0.0.1';
const HTTP_PORT = 8987;
const TIMEOUT = 1;
const IS_SECURE = false;

let client;
let httpServer;
let apiReceiverFn;
let httpResponseStatusCode;
let httpResponse = {};

function globalBe() {
    httpResponseStatusCode = 200;
    apiReceiverFn = () => {};
    client = new BeamExplorerClient({
        host: HTTP_HOST,
        port: HTTP_PORT,
        timeout: TIMEOUT,
        isSecure: IS_SECURE
    });
}

function globalAe() {
    client.removeAllListeners();
}


describe('BeamExplorerClient', () => {

    before(done => {
        httpServer = http.createServer((req, res) => {
            apiReceiverFn(req);
            req.on('data', chunk => {});
            req.on('end', function () {
                res.writeHead(httpResponseStatusCode, {"Content-Type": "application/json"});
                res.end(JSON.stringify(httpResponse));
            });
        });
        httpServer.listen(HTTP_PORT, () => { done() });
    });

    after(() => {
        httpServer.close();
    });

    context('properties', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

        it('should return correct value for host property', () => {
            assert.strictEqual(client.host, HTTP_HOST);
        });

        it('should return correct value for port property', () => {
            assert.strictEqual(client.port, HTTP_PORT);
        });

        it('should return correct value for timeout property', () => {
            assert.strictEqual(client.timeout, TIMEOUT);
        });

        it('should return correct value for isSecure property', () => {
            assert.strictEqual(client.isSecure, IS_SECURE);
        });
    });

    describe('getStatus function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

        it('should callback error correctly', done => {
            httpResponseStatusCode = 404;
            client.getStatus({
                callback: (err) => {
                    assert.strictEqual(!!err, true);
                    assert.strictEqual(err.statusCode, 404);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { a: 'bc' };
            client.getStatus({
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should send correct request to API server', done => {
            apiReceiverFn = (req) => {
                assert.strictEqual(req.method, 'GET');
                assert.strictEqual(req.url, '/status');
                done();
            };
            client.getStatus({
                callback: () => { }
            });
        });

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.path, 'status');
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getStatus({
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry();
                }
                else if (ev.retryCount === 1) {
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getStatus({
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry({
                        host: 'localhost'
                    });
                }
                else if (ev.retryCount === 1) {
                    assert.strictEqual(ev.host, 'localhost');
                    assert.strictEqual(ev.port, HTTP_PORT);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getStatus({
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                callback: () => {}
            };
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getStatus');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getStatus(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.path, 'status');
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getStatus({
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry();
                }
                else if (ev.retryCount === 1) {
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getStatus({
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry({
                        host: 'localhost'
                    });
                }
                else if (ev.retryCount === 1) {
                    assert.strictEqual(ev.host, 'localhost');
                    assert.strictEqual(ev.port, 2)
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getStatus({
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                callback: () => {}
            };
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getStatus');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getStatus(args);
        });
    });

    describe('getBlock function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

        it('should callback error correctly', done => {
            httpResponseStatusCode = 404;
            client.getBlock({
                id: 'abc',
                callback: (err) => {
                    assert.strictEqual(!!err, true);
                    assert.strictEqual(err.statusCode, 404);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { a: 'bc' };
            client.getBlock({
                id: 'abc',
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should send correct request to API server', done => {
            apiReceiverFn = (req) => {
                assert.strictEqual(req.method, 'GET');
                assert.strictEqual(req.url, '/block?hash=abc');
                done();
            };
            client.getBlock({
                id: 'abc',
                callback: () => { }
            });
        });

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.path, 'block?hash=abc');
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getBlock({
                id: 'abc',
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry();
                }
                else if (ev.retryCount === 1) {
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlock({
                id: 'abc',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry({
                        host: 'localhost'
                    });
                }
                else if (ev.retryCount === 1) {
                    assert.strictEqual(ev.host, 'localhost');
                    assert.strictEqual(ev.port, HTTP_PORT);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlock({
                id: 'abc',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                id: 'abc',
                callback: () => {}
            };
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getBlock');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getBlock(args);
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    startTime = Date.now();
                    ev.retry({
                        host: 'localhost'
                    }, 2000);
                }
                else if (ev.retryCount === 1) {
                    const delayMs = Date.now() - startTime;
                    assert.strictEqual(delayMs > 1950, true);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlock({
                id: 'abc',
                callback: () => {}
            });
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.path, 'block?hash=abc');
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getBlock({
                id: 'abc',
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry();
                }
                else if (ev.retryCount === 1) {
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getStatus({
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry({
                        host: 'localhost'
                    });
                }
                else if (ev.retryCount === 1) {
                    assert.strictEqual(ev.host, 'localhost');
                    assert.strictEqual(ev.port, 2)
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlock({
                id: 'abc',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    startTimeMs = Date.now();
                    ev.retry({
                        host: 'localhost'
                    }, 2000);
                }
                else if (ev.retryCount === 1) {
                    let delayMs = Date.now() - startTimeMs;
                    assert.strictEqual(delayMs > 1950, true);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlock({
                id: 'abc',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                id: 'abc',
                callback: () => {}
            };
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getBlock');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getBlock(args);
        });
    });

    describe('getBlockAt function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

        it('should callback error correctly', done => {
            httpResponseStatusCode = 404;
            client.getBlockAt({
                height: 10,
                callback: (err) => {
                    assert.strictEqual(!!err, true);
                    assert.strictEqual(err.statusCode, 404);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { a: 'bc' };
            client.getBlockAt({
                height: 10,
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should send correct request to API server', done => {
            apiReceiverFn = (req) => {
                assert.strictEqual(req.method, 'GET');
                assert.strictEqual(req.url, '/block?height=10');
                done();
            };
            client.getBlockAt({
                height: 10,
                callback: () => { }
            });
        });

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.path, 'block?height=10');
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getBlockAt({
                height: 10,
                callback: () => { }
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry();
                }
                else if (ev.retryCount === 1) {
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockAt({
                height: 10,
                callback: () => { }
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry({
                        host: 'localhost'
                    });
                }
                else if (ev.retryCount === 1) {
                    assert.strictEqual(ev.host, 'localhost');
                    assert.strictEqual(ev.port, HTTP_PORT);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockAt({
                height: 10,
                callback: () => { }
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                height: 10,
                callback: () => { }
            };
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getBlockAt');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getBlockAt(args);
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    startTime = Date.now();
                    ev.retry({
                        host: 'localhost'
                    }, 2000);
                }
                else if (ev.retryCount === 1) {
                    const delayMs = Date.now() - startTime;
                    assert.strictEqual(delayMs > 1950, true);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockAt({
                height: 10,
                callback: () => { }
            });
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.path, 'block?height=10');
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getBlockAt({
                height: 10,
                callback: () => { }
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry();
                }
                else if (ev.retryCount === 1) {
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockAt({
                height: 10,
                callback: () => { }
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry({
                        host: 'localhost'
                    });
                }
                else if (ev.retryCount === 1) {
                    assert.strictEqual(ev.host, 'localhost');
                    assert.strictEqual(ev.port, 2)
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockAt({
                height: 10,
                callback: () => { }
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    startTimeMs = Date.now();
                    ev.retry({
                        host: 'localhost'
                    }, 2000);
                }
                else if (ev.retryCount === 1) {
                    let delayMs = Date.now() - startTimeMs;
                    assert.strictEqual(delayMs > 1950, true);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockAt({
                height: 10,
                callback: () => { }
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                height: 10,
                callback: () => { }
            };
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getBlockAt');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getBlockAt(args);
        });
    });

    describe('getBlockByKernel function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

        it('should callback error correctly', done => {
            httpResponseStatusCode = 404;
            client.getBlockByKernel({
                id: 'abc',
                callback: (err) => {
                    assert.strictEqual(!!err, true);
                    assert.strictEqual(err.statusCode, 404);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { a: 'bc' };
            client.getBlockByKernel({
                id: 'abc',
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should send correct request to API server', done => {
            apiReceiverFn = (req) => {
                assert.strictEqual(req.method, 'GET');
                assert.strictEqual(req.url, '/block?kernel=abc');
                done();
            };
            client.getBlockByKernel({
                id: 'abc',
                callback: () => { }
            });
        });

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.path, 'block?kernel=abc');
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getBlockByKernel({
                id: 'abc',
                callback: () => { }
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry();
                }
                else if (ev.retryCount === 1) {
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockByKernel({
                id: 'abc',
                callback: () => { }
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry({
                        host: 'localhost'
                    });
                }
                else if (ev.retryCount === 1) {
                    assert.strictEqual(ev.host, 'localhost');
                    assert.strictEqual(ev.port, HTTP_PORT);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockByKernel({
                id: 'abc',
                callback: () => { }
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                id: 'abc',
                callback: () => { }
            };
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getBlockByKernel');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getBlockByKernel(args);
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    startTime = Date.now();
                    ev.retry({
                        host: 'localhost'
                    }, 2000);
                }
                else if (ev.retryCount === 1) {
                    const delayMs = Date.now() - startTime;
                    assert.strictEqual(delayMs > 1950, true);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockByKernel({
                id: 'abc',
                callback: () => { }
            });
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.path, 'block?kernel=abc');
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getBlockByKernel({
                id: 'abc',
                callback: () => { }
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry();
                }
                else if (ev.retryCount === 1) {
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockByKernel({
                id: 'abc',
                callback: () => { }
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry({
                        host: 'localhost'
                    });
                }
                else if (ev.retryCount === 1) {
                    assert.strictEqual(ev.host, 'localhost');
                    assert.strictEqual(ev.port, 2)
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockByKernel({
                id: 'abc',
                callback: () => { }
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    startTimeMs = Date.now();
                    ev.retry({
                        host: 'localhost'
                    }, 2000);
                }
                else if (ev.retryCount === 1) {
                    let delayMs = Date.now() - startTimeMs;
                    assert.strictEqual(delayMs > 1950, true);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlockByKernel({
                id: 'abc',
                callback: () => { }
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                id: 'abc',
                callback: () => { }
            };
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getBlockByKernel');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getBlockByKernel(args);
        });
    });

    describe('getBlocks function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

        it('should callback error correctly', done => {
            httpResponseStatusCode = 404;
            client.getBlocks({
                height: 10,
                count: 3,
                callback: (err) => {
                    assert.strictEqual(!!err, true);
                    assert.strictEqual(err.statusCode, 404);
                    done();
                }
            });
        });

        it('should callback result correctly', done => {
            httpResponse = { a: 'bc' };
            client.getBlocks({
                height: 10,
                count: 3,
                callback: (err, result) => {
                    assert.strictEqual(!!err, false);
                    assert.strictEqual(result.a, 'bc');
                    done();
                }
            });
        });

        it('should send correct request to API server', done => {
            apiReceiverFn = (req) => {
                assert.strictEqual(req.method, 'GET');
                assert.strictEqual(req.url, '/blocks?height=10&n=3');
                done();
            };
            client.getBlocks({
                height: 10,
                count: 3,
                callback: () => { }
            });
        });

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.path, 'blocks?height=10&n=3');
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getBlocks({
                height: 10,
                count: 3,
                callback: () => { }
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry();
                }
                else if (ev.retryCount === 1) {
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlocks({
                height: 10,
                count: 3,
                callback: () => { }
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    startTime = Date.now();
                    ev.retry({
                        host: 'localhost'
                    }, 2000);
                }
                else if (ev.retryCount === 1) {
                    const delayMs = Date.now() - startTime;
                    assert.strictEqual(delayMs > 1950, true);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlocks({
                height: 10,
                count: 3,
                callback: () => { }
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry({
                        host: 'localhost'
                    });
                }
                else if (ev.retryCount === 1) {
                    assert.strictEqual(ev.host, 'localhost');
                    assert.strictEqual(ev.port, HTTP_PORT);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlocks({
                height: 10,
                count: 3,
                callback: () => { }
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                height: 10,
                count: 3,
                callback: () => { }
            };
            client.on(BeamExplorerClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getBlocks');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getBlocks(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.path, 'blocks?height=10&n=3');
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getBlocks({
                height: 10,
                count: 3,
                callback: () => { }
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry();
                }
                else if (ev.retryCount === 1) {
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlocks({
                height: 10,
                count: 3,
                callback: () => { }
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    ev.retry({
                        host: 'localhost'
                    });
                }
                else if (ev.retryCount === 1) {
                    assert.strictEqual(ev.host, 'localhost');
                    assert.strictEqual(ev.port, 2)
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlocks({
                height: 10,
                count: 3,
                callback: () => { }
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                if (ev.retryCount === 0) {
                    startTimeMs = Date.now();
                    ev.retry({
                        host: 'localhost'
                    }, 2000);
                }
                else if (ev.retryCount === 1) {
                    let delayMs = Date.now() - startTimeMs;
                    assert.strictEqual(delayMs > 1950, true);
                    done();
                }
                else {
                    throw new Error('Unexpected outcome');
                }
            });
            client.getBlocks({
                height: 10,
                count: 3,
                callback: () => { }
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                height: 10,
                count: 3,
                callback: () => { }
            };
            client.on(BeamExplorerClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getBlocks');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getBlocks(args);
        });
    });
});