'use strict';

const
    precon = require('@mintpond/mint-precon'),
    pu = require('@mintpond/mint-utils').prototypes,
    BeamExplorerClient = require('./../libs/class.BeamExplorerClient');


class MockBeamExplorerClient extends BeamExplorerClient {

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
        // for the function they are for suffixed with "Result" or "Error".

        // getStatus
        _._getStatusError = null;
        _._getStatusResult = {
            chainwork: '0x38594101d0a0',
            hash: '7353b5e4ad29a2ffa5f7952749d1eb04acedd82215b1f4f01d75107165f4622b',
            height: 20531,
            low_horizon: 19090,
            timestamp: 1550158283
        };

        // getBlock
        _._getBlockError = null;
        _._getBlockResult = {
            chainwork: '0x384fdc718a20',
            difficulty: 157.9972152709961,
            found: true,
            hash: 'c2a7315b63b1de6106a185c1c79219001ef5e3a07c217db227b079bbb9dd9b64',
            height: 20516,
            inputs: [],
            kernels: [
                {
                    excess: '0x60413b5a09858312403190721938463ca22d7d87981a024873ddfa204a399eec',
                    fee: 0,
                    id: 'd72684dba6255b2fe8631be9df764ee3c984cb0c9f386a8cf71f566acebd197d',
                    maxHeight: 18446744073709552000,
                    minHeight: 20516
                }
            ],
            outputs: [
                {
                    coinbase: true,
                    commitment: '0x75329071d041e7828a57cbf2f63fb8db21543f35c1c2291d5c26c20d9b11465a',
                    incubation: 0,
                    maturity: 20756
                }
            ],
            prev: '4b9e35b467b416e0d307dd94bd2fdce6e720b6b3a029dca822ccab3ac57c6d22',
            subsidy: 8000000000,
            timestamp: 1550157362
        };

        // getBlockAt
        _._getBlockAtError = null;
        _._getBlockAtResult = {
            chainwork: '0x384fdc718a20',
            difficulty: 157.9972152709961,
            found: true,
            hash: 'c2a7315b63b1de6106a185c1c79219001ef5e3a07c217db227b079bbb9dd9b64',
            height: 20516,
            inputs: [],
            kernels: [
                {
                    excess: '0x60413b5a09858312403190721938463ca22d7d87981a024873ddfa204a399eec',
                    fee: 0,
                    id: 'd72684dba6255b2fe8631be9df764ee3c984cb0c9f386a8cf71f566acebd197d',
                    maxHeight: 18446744073709552000,
                    minHeight: 20516
                }
            ],
            outputs: [
                {
                    coinbase: true,
                    commitment: '0x75329071d041e7828a57cbf2f63fb8db21543f35c1c2291d5c26c20d9b11465a',
                    incubation: 0,
                    maturity: 20756
                }
            ],
            prev: '4b9e35b467b416e0d307dd94bd2fdce6e720b6b3a029dca822ccab3ac57c6d22',
            subsidy: 8000000000,
            timestamp: 1550157362
        };

        // getBlockByKernel
        _._getBlockByKernelError = null;
        _._getBlockByKernelResult = {
            chainwork: '0x384fdc718a20',
            difficulty: 157.9972152709961,
            found: true,
            hash: 'c2a7315b63b1de6106a185c1c79219001ef5e3a07c217db227b079bbb9dd9b64',
            height: 20516,
            inputs: [],
            kernels: [
                {
                    excess: '0x60413b5a09858312403190721938463ca22d7d87981a024873ddfa204a399eec',
                    fee: 0,
                    id: 'd72684dba6255b2fe8631be9df764ee3c984cb0c9f386a8cf71f566acebd197d',
                    maxHeight: 18446744073709552000,
                    minHeight: 20516
                }
            ],
            outputs: [
                {
                    coinbase: true,
                    commitment: '0x75329071d041e7828a57cbf2f63fb8db21543f35c1c2291d5c26c20d9b11465a',
                    incubation: 0,
                    maturity: 20756
                }
            ],
            prev: '4b9e35b467b416e0d307dd94bd2fdce6e720b6b3a029dca822ccab3ac57c6d22',
            subsidy: 8000000000,
            timestamp: 1550157362
        };

        // getBlocks
        _._getBlocksError = null;
        _._getBlocksResult = [
            {
                chainwork: '0x380b69b2d420',
                difficulty: 161.94402313232422,
                found: true,
                hash: '2107b173f174972c8ec7543ab731bf1905d24d101f45b42d5f0cd64853e4c38e',
                height: 20402,
                inputs: [],
                kernels: [
                    {
                        excess: '0x3829270cf74d473af83015501a83747b5b8c75c0d13303569a352bfe53b4ef4b',
                        fee: 0,
                        id: '3d0bed1e452c911f830351c671696f51e4a6a9086aeb7a059fc027a0db9c84a0',
                        maxHeight: 18446744073709552000,
                        minHeight: 20402
                    }
                ],
                outputs: [
                    {
                        coinbase: true,
                        commitment: '0xb4261a4a7fabe181f6dd7e766410cf1aba8892fd2f41d3a7ff9378a4811521ff',
                        incubation: 0,
                        maturity: 20642
                    }
                ],
                prev: '09cf95acda1e9c3e8b1a45873fd9ef1d744d6645d16bd6b8c5e9ae8dfe2d0b1a',
                subsidy: 8000000000,
                timestamp: 1550150788
            },
            {
                chainwork: '0x380ac7c128a0',
                difficulty: 162.0944366455078,
                found: true,
                hash: '09cf95acda1e9c3e8b1a45873fd9ef1d744d6645d16bd6b8c5e9ae8dfe2d0b1a',
                height: 20401,
                inputs: [],
                kernels: [
                    {
                        excess: '0x554a6ef457d33abddcb98169fcd7fe68a7aa94bc2145a40f39d07ace7b43c0de',
                        fee: 0,
                        id: 'c68cddd64a07974a1d5ea73eb4333a9b732a5b9ac705546217fa66d2ba5e8dd8',
                        maxHeight: 18446744073709552000,
                        minHeight: 20401
                    }
                ],
                'outputs': [
                    {
                        coinbase: true,
                        commitment: '0x6fd9e1124f91a744c7043f2873716094e1a6cc3a8ae9ca5278a1a421a7622301',
                        incubation: 0,
                        maturity: 20641
                    }
                ],
                prev: '9a8053f05ed7b6575770e002100025fa58452e307cf73d3594cbcd861fa5035a',
                subsidy: 8000000000,
                timestamp: 1550150719
            },
            {
                chainwork: '0x380a25a8fba0',
                difficulty: 161.4037857055664,
                found: true,
                hash: '9a8053f05ed7b6575770e002100025fa58452e307cf73d3594cbcd861fa5035a',
                height: 20400,
                inputs: [],
                kernels: [
                    {
                        excess: '0x7eef6fa3449e87dde801fec11cd6cec8b448a87f7bd1231cff668904ee6045d5',
                        fee: 0,
                        id: 'bee59b34ea59a95e9fb415d34de3cc34416debcc1e14fd993f749b2aaee9b14d',
                        maxHeight: 18446744073709552000,
                        minHeight: 20400
                    }
                ],
                outputs: [
                    {
                        coinbase: true,
                        commitment: '0x3b8a5d665b08119b8b8ee98c831089e0f7b3219ee92b3cf9d749777349ffd285',
                        incubation: 0,
                        maturity: 20640
                    }
                ],
                prev: '34ce853ef5d9b6878bb694b5eec0620217d2b5f68f36cfdfc9c3bd4f1ae67107',
                subsidy: 8000000000,
                timestamp: 1550150667
            }
        ];

        _.on(MockBeamExplorerClient.EVENT_API_REQUEST, ev => {

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


    static get CLASS_ID() { return '8eaaf0bc6ec92b8236b108fd2a58e1ed4b75d7f6c385f7bef57bc9126c38d208'; }
    static [Symbol.hasInstance](obj) {
        return pu.isInstanceOfById(obj, MockBeamExplorerClient.CLASS_ID);
    }
}

module.exports = MockBeamExplorerClient;