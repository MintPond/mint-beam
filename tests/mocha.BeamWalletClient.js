'use strict';

const
    assert = require('assert'),
    http = require('http'),
    BeamWalletClient = require('./../libs/class.BeamWalletClient'),
    BeamAddressExpire = require('./../libs/const.BeamAddressExpire'),
    BeamTxStatus = require('./../libs/const.BeamTxStatus');

const HTTP_HOST = '127.0.0.1';
const HTTP_PORT = 8989;
const TIMEOUT = 1;
const IS_SECURE = false;

let client;
let httpResponseStatusCode;
let httpServer;
let apiReceiverFn;
let httpResponse = {};

function globalBe() {
    apiReceiverFn = () => {};
    httpResponseStatusCode = 200;
    client = new BeamWalletClient({
        host: HTTP_HOST,
        port: HTTP_PORT,
        timeout: TIMEOUT,
        isSecure: IS_SECURE
    });
}

function globalAe() {
    client.removeAllListeners();
}


describe('BeamWalletClient', () => {

    before(done => {
        httpServer = http.createServer((req, res) => {
            req.on('data', chunk => {
                apiReceiverFn(req.method, JSON.parse(chunk.toString()));
            });
            req.on('end', function(){
                res.writeHead(httpResponseStatusCode, { "Content-Type": "application/json" });
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

    describe('createAddress function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'createAddress');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.createAddress(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.createAddress({
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                expire: BeamAddressExpire.HOURS_24,
                comment: 'Test',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'createAddress');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.createAddress(args);
        });
    });

    describe('validateAddress function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.validateAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.validateAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.validateAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.validateAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                address: 'abc',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'validateAddress');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.validateAddress(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.validateAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.validateAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.validateAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.validateAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                address: 'abc',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'validateAddress');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.validateAddress(args);
        });
    });

    describe('addrList function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.addrList({
                own: true,
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.addrList({
                own: true,
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.addrList({
                own: true,
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.addrList({
                own: true,
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                own: true,
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'addrList');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.addrList(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.addrList({
                own: true,
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.addrList({
                own: true,
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.addrList({
                own: true,
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.addrList({
                own: true,
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                own: true,
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'addrList');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.addrList(args);
        });
    });

    describe('deleteAddress function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.deleteAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.deleteAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.deleteAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.deleteAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                address: 'abc',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'deleteAddress');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.deleteAddress(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.deleteAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.deleteAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.deleteAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.deleteAddress({
                address: 'abc',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                address: 'abc',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'deleteAddress');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.deleteAddress(args);
        });
    });

    describe('editAddress function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.editAddress({
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.editAddress({
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.editAddress({
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.editAddress({
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'editAddress');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.editAddress(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.editAddress({
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.editAddress({
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.editAddress({
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.editAddress({
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                address: 'abc',
                comment: 'Test',
                expire: BeamAddressExpire.NEVER,
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'editAddress');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.editAddress(args);
        });
    });

    describe('txSend function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'txSend');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.txSend(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txSend({
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                value: 1000,
                fee: 100,
                from: 'abcFrom',
                address: 'abc',
                comment: 'Test',
                txId: 'tx',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'txSend');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.txSend(args);
        });
    });

    describe('txSplit function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.txSplit({
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txSplit({
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txSplit({
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txSplit({
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'txSplit');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.txSplit(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.txSplit({
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txSplit({
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txSplit({
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txSplit({
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                coins: [100, 1000, 10000],
                fee: 100,
                txId: 'tx',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'txSplit');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.txSplit(args);
        });
    });

    describe('txCancel function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.txCancel({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txCancel({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txCancel({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txCancel({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                txId: 'tx',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'txCancel');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.txCancel(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.txCancel({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txCancel({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txCancel({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txCancel({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                txId: 'tx',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'txCancel');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.txCancel(args);
        });
    });

    describe('txStatus function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.txStatus({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txStatus({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txStatus({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txStatus({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                txId: 'tx',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'txStatus');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.txStatus(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.txStatus({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txStatus({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txStatus({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txStatus({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                txId: 'tx',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'txStatus');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.txStatus(args);
        });
    });

    describe('txList function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.txList({
                skip: 0,
                count: 200,
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txList({
                skip: 0,
                count: 200,
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txList({
                skip: 0,
                count: 200,
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.txList({
                skip: 0,
                count: 200,
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                skip: 0,
                count: 200,
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'txList');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.txList(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.txList({
                skip: 0,
                count: 200,
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txList({
                skip: 0,
                count: 200,
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txList({
                skip: 0,
                count: 200,
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.txList({
                skip: 0,
                count: 200,
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                skip: 0,
                count: 200,
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'txList');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.txList(args);
        });
    });

    describe('walletStatus function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.walletStatus({
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.walletStatus({
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.walletStatus({
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.walletStatus({
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'walletStatus');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.walletStatus(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.walletStatus({
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.walletStatus({
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.walletStatus({
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.walletStatus({
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'walletStatus');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.walletStatus(args);
        });
    });

    describe('getUTXO function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getUTXO({
                count: 100,
                skip: 0,
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.getUTXO({
                count: 100,
                skip: 0,
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.getUTXO({
                count: 100,
                skip: 0,
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.getUTXO({
                count: 100,
                skip: 0,
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                count: 100,
                skip: 0,
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getUTXO');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getUTXO(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.getUTXO({
                count: 100,
                skip: 0,
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.getUTXO({
                count: 100,
                skip: 0,
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.getUTXO({
                count: 100,
                skip: 0,
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.getUTXO({
                count: 100,
                skip: 0,
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                count: 100,
                skip: 0,
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'getUTXO');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.getUTXO(args);
        });
    });

    describe('generateTxId function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.generateTxId({
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.generateTxId({
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.generateTxId({
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.generateTxId({
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'generateTxId');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.generateTxId(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.generateTxId({
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.generateTxId({
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.generateTxId({
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.generateTxId({
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'generateTxId');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.generateTxId(args);
        });
    });

    describe('exportPaymentProof function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.exportPaymentProof({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.exportPaymentProof({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.exportPaymentProof({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.exportPaymentProof({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                txId: 'tx',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'exportPaymentProof');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.exportPaymentProof(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.exportPaymentProof({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.exportPaymentProof({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.exportPaymentProof({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.exportPaymentProof({
                txId: 'tx',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                txId: 'tx',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'exportPaymentProof');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.exportPaymentProof(args);
        });
    });

    describe('verifyPaymentProof function', () => {
        beforeEach(globalBe);
        afterEach(globalAe);

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

        it('should emit EVENT_API_ERROR on status code other than 200', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.statusCode, 404);
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, HTTP_PORT);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: () => {}
            });
        });

        it('should retry when EVENT_API_ERROR retry function is called', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_API_ERROR retry function is called with args', done => {
            httpResponseStatusCode = 404;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_API_ERROR retry function is called with delay', function(done) {
            this.timeout(7000);
            httpResponseStatusCode = 404;
            let startTime;
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
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
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_API_ERROR', done => {
            httpResponseStatusCode = 404;
            const args = {
                paymentProof: 'proof',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_API_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'verifyPaymentProof');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.verifyPaymentProof(args);
        });

        it('should emit EVENT_SOCKET_ERROR on socket error', function(done) {
            this.timeout(7000);
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.host, HTTP_HOST);
                assert.strictEqual(ev.port, 2);
                assert.strictEqual(ev.retryCount, 0);
                done();
            });
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: () => {}
            });
        });

        it('should retry when EVENT_SOCKET_ERROR retry function is called', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: () => {}
            });
        });

        it('should modify connection args when EVENT_SOCKET_ERROR retry function is called with args', function(done) {
            this.timeout(7000)
            client._port = 2;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: () => {}
            });
        });

        it('should delay retry when EVENT_SOCKET_ERROR retry function is called with delay', function(done) {
            this.timeout(7000)
            client._port = 2;
            let startTimeMs;
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
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
            client.verifyPaymentProof({
                paymentProof: 'proof',
                callback: () => {}
            });
        });

        it('should pass function name and args to EVENT_SOCKET_ERROR', done => {
            client._port = 2;
            const args = {
                paymentProof: 'proof',
                callback: () => {}
            };
            client.on(BeamWalletClient.EVENT_SOCKET_ERROR, ev => {
                assert.strictEqual(ev.fnName, 'verifyPaymentProof');
                assert.strictEqual(ev.fnArgs, args);
                done();
            });
            client.verifyPaymentProof(args);
        });
    });
});