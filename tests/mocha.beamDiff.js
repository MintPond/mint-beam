'use strict';

const
    assert = require('assert'),
    beamDiff = require('./../libs/service.beamDiff');


describe('beamDiff', () => {

    describe('pack function', () => {

        it('should correctly pack a difficulty (1)', () => {
            const packed = beamDiff.pack(2);
            assert.strictEqual(packed, 16777216);
        });

        it('should correctly pack a difficulty (2)', () => {
            const packed = beamDiff.pack(100.5);
            assert.strictEqual(packed, 110231552);
        });
    });

    describe('unpack function', () => {

        it('should correctly unpack a difficulty (1)', () => {
            const unpacked = beamDiff.unpack(16777216);
            assert.strictEqual(unpacked, 2);
        });

        it('should correctly pack a difficulty (2)', () => {
            const unpacked = beamDiff.unpack(110231552);
            assert.strictEqual(unpacked, 100.5);
        });
    });
});