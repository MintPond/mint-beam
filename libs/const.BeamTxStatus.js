'use strict';

const BeamTxStatus = {
    get PENDING() { return 0 },
    get IN_PROGRESS() { return 1 },
    get CANCELED() { return 2 },
    get COMPLETED() { return 3 },
    get FAILED() { return 4 },
    get REGISTERING() { return 5 }
};

module.exports = BeamTxStatus;

Object.defineProperties(BeamTxStatus, {
    all: {
        value: [
            BeamTxStatus.PENDING,
            BeamTxStatus.IN_PROGRESS,
            BeamTxStatus.CANCELED,
            BeamTxStatus.COMPLETED,
            BeamTxStatus.FAILED,
            BeamTxStatus.REGISTERING
        ],
        enumerable: false
    }
});
