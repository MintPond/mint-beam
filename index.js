'use strict';

module.exports = {
    /* API Clients */
    BeamExplorerClient: require('./libs/class.BeamExplorerClient'),
    BeamMiningClient: require('./libs/class.BeamMiningClient'),
    BeamWalletClient: require('./libs/class.BeamWalletClient'),

    /* Constants */
    BeamAddressExpire: require('./libs/const.BeamAddressExpire'),
    BeamTxStatus: require('./libs/const.BeamTxStatus'),
    BeamTxType: require('./libs/const.BeamTxType'),

    /* Utils */
    beamDiff: require('./libs/service.beamDiff'),
    beamReward: require('./libs/service.beamReward'),

    /* Mockups */
    MockBeamExplorerClient: require('./mocks/class.MockBeamExplorerClient'),
    MockBeamMiningClient: require('./mocks/class.MockBeamMiningClient'),
    MockBeamWalletClient: require('./mocks/class.MockBeamWalletClient')
};