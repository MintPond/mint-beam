'use strict';

const BeamTxType = {
    get SIMPLE() { return 0 },
    get ASSET_ISSUE() { return 2 },
    get ASSET_CONSUME() { return 3 },
    get ASSET_INFO() { return 6 }
};

module.exports = BeamTxType;

Object.defineProperties(BeamTxType, {
    all: {
        value: [
            BeamTxType.SIMPLE,
            BeamTxType.ASSET_ISSUE,
            BeamTxType.ASSET_CONSUME,
            BeamTxType.ASSET_INFO
        ],
        enumerable: false
    }
})