'use strict';

const
    precon = require('@mintpond/mint-precon'),
    BeamWalletClient = require('./../libs/class.BeamWalletClient');


class MockBeamWalletClient extends BeamWalletClient {

    /**
     * Constructor.
     *
     * @param [args]
     * @param [args.host] {string}
     * @param [args.port] {number}
     * @param [args.timeout] {number}
     * @param [args.isSecure] {boolean}
     */
    constructor(args) {
        if (args) {
            precon.opt_string(args.host, 'string');
            precon.opt_minMaxInteger(args.port, 1, 65535, 'port');
            precon.opt_positiveNumber(args.timeout, 'timeout');
            precon.opt_boolean(args.isSecure, 'boolean');
        }

        super({
            host: args ? args.host || '127.0.0.1' : '127.0.0.1',
            port: args ? args.port || 8888 : 8888,
            timeout: args ? args.timeout : 15,
            isSecure: args ? args.isSecure : false
        });

        const _ = this;

        // These private variables can be altered by external tests as needed. The variables are named
        // for the function they are for suffixed with "Result".

        // createAddress
        _._createAddressError = null;
        _._createAddressResult = '472e17b0419055ffee3b3813b98ae671579b0ac0dcd6f1a23b11a75ab148cc67'

        // validateAddress
        _._validateAddressError = null;
        _._validateAddressResult = {
            is_valid: true,
            is_mine: false
        };

        // addrList
        _._addrListError = null;
        _._addrListResult = [{
            address: '29510b33fac0cb20695fd3b836d835451e600c4224d8fb335dc1a68271deb9b6b5b',
            category: '',
            create_time: 1553174321,
            duration: 1520,
            expired: true,
            comment: '',
            own: true,
            own_id: 16730903,
            own_id_str: '16730903',
            identity: '2d8738b0424ad50631e902fab655e7e1795fbb8d92d47c4c8df7336870fcadf5'
        }];

        // deleteAddress
        _._deleteAddressError = null;
        _._deleteAddressResult = 'done';

        // editAddress
        _._editAddressError = null;
        _._editAddressResult = 'done';

        // txSend
        _._txSendError = null;
        _._txSendResult = { txId: '10c4b760c842433cb58339a0fafef3db' };

        // txSplit
        _._txSplitError = null;
        _._txSplitResult = { txId: '10c4b760c842433cb58339a0fafef3db' };

        // txCancel
        _._txCancelError = null;
        _._txCancelResult = true;

        // txStatus
        _._txStatusError = null;
        _._txStatusResult = {
            txId : '10c4b760c842433cb58339a0fafef3db',
            asset_id: 0,
            comment: '',
            fee: 100,
            kernel: '0000000000000000000000000000000000000000000000000000000000000000',
            receiver: '472e17b0419055ffee3b3813b98ae671579b0ac0dcd6f1a23b11a75ab148cc67',
            sender: 'f287176bdd517e9c277778e4c012bf6a3e687dd614fc552a1ed22a3fee7d94f2',
            status: 4,
            status_string : 'Failed',
            tx_type: 0,
            tx_type_string: 'simple',
            failure_reason : 'No inputs',
            value: 12342342,
            create_time : 1551100217,
            income : false,
            sender_identity: 'a0a1ebbfeed5c312b309e32715c159e6b4548a6c6c3af25d0dbc16f37a1e9dd6',
            receiver_identity: '2d8738b0424ad50631e902fab655e7e1795fbb8d92d47c4c8df7336870fcadf5',
            token: '44pE7ySjZYjbLqwnTJANvr4BudMk1RdvWvaZnBvoCTwFnigfaTSza75bvw7x2GCa377Z4CSRRYZon44Ss9G9joSicNRAgts4u3pL6yV6jDQ6gAVJD9Scyr'
        };

        // txList
        _._txListError = null;
        _._txListResult = [
            {
                asset_id: 0,
                txId : '10c4b760c842433cb58339a0fafef3db',
                comment: '',
                fee: 0,
                kernel: '0000000000000000000000000000000000000000000000000000000000000000',
                receiver: '472e17b0419055ffee3b3813b98ae671579b0ac0dcd6f1a23b11a75ab148cc67',
                sender: 'f287176bdd517e9c277778e4c012bf6a3e687dd614fc552a1ed22a3fee7d94f2',
                status: 4,
                status_string : 'Failed',
                failure_reason : 'No inputs',
                value: 12342342,
                create_time : 1551100217,
                income : false,
                token: '44pE7ySjZYjbLqwnTJANvr4BudMk1RdvWvaZnBvoCTwFnigfaTSza75bvw7x2GCa377Z4CSRRYZon44Ss9G9joSicNRAgts4u3pL6yV6jDQ6gAVJD9Scyr'
            },
            {
                asset_id: 1,
                asset_meta: 'STD:N=Coin;SN=CN;UN=Cgro;NTHUN=Cgroth',
                comment: '',
                confirmations: 102,
                create_time: 1586995332,
                fee: 0,
                height: 1908,
                income: false,
                receiver: '0',
                sender: '0',
                status: 3,
                status_string: 'asset confirmed',
                txId: 'd9f94306127a4ef894733f984b5512cf',
                tx_type: 6,
                tx_type_string: 'asset info',
                value: 0
            },
            {
                asset_id: 1,
                asset_meta: "STD:N=Coin;SN=CN;UN=Cgro;NTHUN=Cgroth",
                comment: "",
                confirmations: 1985,
                height: 25,
                create_time: 1586966478,
                fee: 100,
                income: false,
                kernel: "1c9e4a9a61df1dda00db10ab4477f88355e13d4ed06c0db36c39b22a2a66f642",
                receiver: "0",
                sender: "0",
                status: 3,
                status_string: "asset issued",
                txId: "77008a76aa4b4da697587040b2d21f1e",
                tx_type: 2,
                tx_type_string: "asset issue",
                value: 500000000
            }
        ];

        // walletStatus
        _._walletStatusError = null;
        _._walletStatusResult = {
            current_height : 1055,
            current_state_hash : 'f287176bdd517e9c277778e4c012bf6a3e687dd614fc552a1ed22a3fee7d94f2',
            prev_state_hash : 'bd39333a66a8b7cb3804b5978d42312c841dbfa03a1c31fc2f0627eeed6e43f2',
            available: 100500,
            receiving: 123,
            sending: 0,
            maturing: 50,
            locked: 30,
            difficulty: 2.93914,
        };

        // getUTXO
        _._getUTXOError = null;
        _._getUTXOResult = [{
            id: 123,
            asset_id: 0,
            amount: 12345,
            maturity: 60,
            type: 'mine',
            createTxId: '10c4b760c842433cb58339a0fafef3db',
            spentTxId: '',
            status: 2,
            status_string: 'maturing'
        }];

        // generateTxId
        _._generateTxIdError = null;
        _._generateTxIdResult = '10c4b760c842433cb58339a0fafef3db';

        // exportPaymentProof
        _._exportPaymentProofError = null;
        _._exportPaymentProofResult = {
            payment_proof: '8009f28991ef543253c8b6a2caf15cf99e23fb9c2b4ca30dc463c8ceb354d7979e80ef7d4255dd5e885200648abe5826d8e0ba0157d3e8cf9c42dcc8258b036986e50400371789ee82afc25ee29c9c57bcb1018b725a3a94c0ceb1fa7984ea13de4982553e0d78d925a362982182a971e654857b8e407e7ad2e9cb72b2b8228812f8ec50435351000c94e2c85996e9527d9b0c90a1843205a7ec8f99fa534083e5f1d055d9f53894'
        };

        // verifyPaymentProof
        _._verifyPaymentProofError = null;
        _._verifyPaymentProofResult = {
            is_valid: true,
            asset_id: 0,
            sender:   '9f28991ef543253c8b6a2caf15cf99e23fb9c2b4ca30dc463c8ceb354d7979e',
            receiver: 'ef7d4255dd5e885200648abe5826d8e0ba0157d3e8cf9c42dcc8258b036986e5',
            amount:   2300000000,
            kernel:   'ee82afc25ee29c9c57bcb1018b725a3a94c0ceb1fa7984ea13de4982553e0d78'
        }

        _.on(MockBeamWalletClient.EVENT_API_REQUEST, ev => {

            const errName = `_${ev.connectArgs.fnName}Error`;
            const resultName = `_${ev.connectArgs.fnName}Result`;

            if (!(errName in _) || !(resultName in _))
                throw new Error(`Unimplemented function: ${ev.connectArgs.fnName}`);

            if (_[errName]) {
                ev.setError(_[errName]);
            }
            else {
                ev.setResult(_[resultName]);
            }
        });
    }
}

module.exports = MockBeamWalletClient;

