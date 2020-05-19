'use strict';

const precon = require('@mintpond/mint-precon');

const DROP0 = 1440 * 365; // 1 year roughly. This is the height of the last block that still has the initial emission, the drop is starting from the next block
const DROP1 = 1440 * 265 * 4; // 4 years roughly. Each such a cycle there's a new drop


module.exports = {

    /**
     * The number of blocks before the 1st drop in reward.
     * @returns {number}
     */
    get DROP0() { return DROP0 },

    /**
     * The number of blocks between drops in rewards after the 1st drop.
     * @returns {number}
     */
    get DROP1() { return DROP1 },

    /**
     * Calculate reward at specified height.
     *
     * @param height {number}
     * @returns {number}
     */
    calculate: calculate
}


// https://github.com/r45ku1/beam-stratum-pool/blob/739c58829e7b2907b4a698fed40d224b7d90658f/lib/util.js#L74
function calculate(height) {
    precon.positiveInteger(height, 'height');

    let base = 80;
    height -= 1;
    // Current emission strategy:
    // at Emission.Drop0 - 1/2
    // at Emission.Drop1 - 5/8
    // each Emission.Drop1 cycle - 1/2

    if (height < DROP0) {
        return base;
    }

    let n = 1 + (height - DROP0) / DROP1;

    if (n >= 2)
        base += (base >> 2); // the unusual part - add 1/4

    return base >> n;
}