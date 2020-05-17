'use strict';

const BeamAddressExpire = {
    get HOURS_24() { return '24h' },
    get NEVER() { return 'never' },
    get EXPIRED() { return 'expired' }
}

module.exports = BeamAddressExpire;

Object.defineProperties(BeamAddressExpire, {
    all: {
        value: [
            BeamAddressExpire.HOURS_24,
            BeamAddressExpire.NEVER,
            BeamAddressExpire.EXPIRED
        ],
        enumerable: false
    }
})