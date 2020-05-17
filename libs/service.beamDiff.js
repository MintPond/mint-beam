'use strict';

module.exports = {
    pack: pack,
    unpack: unpack
}


// https://github.com/r45ku1/beam-stratum-pool/blob/739c58829e7b2907b4a698fed40d224b7d90658f/lib/util.js#L98
function pack(unpackedDiff) {
    const bits = 32 - Math.clz32(unpackedDiff)
    const correctedOrder = bits - 24 - 1
    const mantissa = unpackedDiff * Math.pow(2, -correctedOrder) - Math.pow(2, 24);
    const order = 24 + correctedOrder
    return mantissa | (order << 24);
}


// https://github.com/r45ku1/beam-stratum-pool/blob/739c58829e7b2907b4a698fed40d224b7d90658f/lib/util.js#L66
function unpack(packedDiff) {
    const leadingBit = 1 << 24
    const order = packedDiff >> 24;
    const result = (leadingBit | (packedDiff & leadingBit - 1)) * Math.pow(2, order - 24);
    return Math.abs(result);
}
