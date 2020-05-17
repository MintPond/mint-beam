'use strict';

const
    assert = require('assert'),
    http = require('http'),
    BeamExplorerClient = require('./../libs/class.BeamExplorerClient');

const HTTP_PORT = 8987;

let client;
let httpServer;
let apiReceiverFn;
let httpResponseStatusCode;
let httpResponse = {};

function globalBe() {
    httpResponseStatusCode = 200;
    apiReceiverFn = () => {};
    client = new BeamExplorerClient({
        host: '127.0.0.1',
        port: HTTP_PORT
    });
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

    describe('getStatus function', () => {
        beforeEach(globalBe);

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
    });

    describe('getBlock function', () => {
        beforeEach(globalBe);

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
    });

    describe('getBlockAt function', () => {
        beforeEach(globalBe);

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
    });

    describe('getBlockByKernel function', () => {
        beforeEach(globalBe);

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
    });

    describe('getBlocks function', () => {
        beforeEach(globalBe);

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
    });
});