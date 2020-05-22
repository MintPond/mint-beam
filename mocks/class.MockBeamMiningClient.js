'use strict';

const
    precon = require('@mintpond/mint-precon'),
    BeamMiningClient = require('./../libs/class.BeamMiningClient');


class MockBeamMiningClient extends BeamMiningClient {

    /**
     * Constructor.
     *
     * @param [args]
     * @param [args.host] {string}
     * @param [args.port] {number}
     * @param [args.apiKey] {string}
     * @param [args.isSecure] {boolean}
     */
    constructor(args) {
        if (args) {
            precon.opt_string(args.host, 'string');
            precon.opt_minMaxInteger(args.port, 1, 65535, 'port');
            precon.opt_string(args.apiKey, 'apiKey');
            precon.opt_boolean(args.isSecure, 'boolean');
        }

        super({
            host: args ? args.host || '127.0.0.1' : '127.0.0.1',
            port: args ? args.port || 8888 : 8888,
            apiKey: args ? args.apiKey || '123abc' : '123abc',
            isSecure: args ? args.isSecure : false
        });

        const _ = this;

        _._connectError = null;
        _._loginError = null;

        _._submitSolutionApiResult = {
            jsonrpc: '2.0',
            id: '000001',
            method: 'result',
            code: 1,
            blockhash: 'blockhash',
            description: 'description'
        };
    }


    /**
     * Emit mockup job event.
     *
     * @param job
     * @param job.id {string}
     * @param job.input {string}
     * @param job.height {number}
     * @param job.difficulty {number}
     */
    emitMockJob(job) {
        precon.string(job.id, 'id');
        precon.string(job.input, 'input');
        precon.positiveInteger(job.height, 'height');
        precon.positiveNumber(job.difficulty, 'difficulty');

        const _ = this;
        _._currentJob = job;
        _.emit(BeamMiningClient.EVENT_JOB, _._currentJob);
    }


    /* Override */
    disconnect() {
        const _ = this;

        if (_._isConnected) {
            _._isConnected = false;
            clearTimeout(_._connectTimeout);
            _.$onDisconnect();
        }
    }


    /* Override */
    submitSolution(args) {
        const _ = this;
        if (_._submitSolutionResult) {
            setImmediate(args.callback.bind(null, null, _._submitSolutionResult));
        }
        else {
            super.submitSolution(args);
        }
    }


    /* Override */
    $connect(connectArgs, callback) {
        const _ = this;
        _.$login(connectArgs.apiKey, callback);
    }


    /* Override */
    $login(apiKey, callback) {
        const _ = this;
        if (_._connectError) {
            callback && setImmediate(callback.bind(null, _._connectError));
        }
        else {
            _.emit(MockBeamMiningClient.EVENT_RESULT, {
                jsonrpc: '2.0',
                id: 'login',
                method: 'result',
                code: 0,
                description: 'success'
            });

            callback && setImmediate(callback);
        }
    }


    /* Override */
    $send(data, callback) {
        const _ = this;
        if (data.method === 'solution') {
            setImmediate(() => {
                _.emit(MockBeamMiningClient.EVENT_RESULT, _._submitSolutionApiResult);
                callback && callback(_._submitSolutionResult);
            });
        }
        else {
            throw new Error(`Unimplemented method: ${data.method}`);
        }
    }
}

module.exports = MockBeamMiningClient;