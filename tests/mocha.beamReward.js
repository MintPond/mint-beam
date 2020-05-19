'use strict';

const
    assert = require('assert'),
    beamReward = require('./../libs/service.beamReward')


describe('beamReward', () => {

    describe('calculate function', () => {

        it('should return correct value before 1st drop in value', () => {
            for (let i = 1; i <= beamReward.DROP0; i++) {
                const reward = beamReward.calculate(i);
                assert.strictEqual(reward, 80);
            }
        });

        it('should return correct value during 1st drop in value', () => {
            for (let i = beamReward.DROP0 + 1; i <= beamReward.DROP0 + beamReward.DROP1; i++) {
                const reward = beamReward.calculate(i);
                assert.strictEqual(reward, 40);
            }
        });

        it('should return correct value during 2nd drop in value', () => {
            const start = beamReward.DROP0 + beamReward.DROP1;
            for (let i = start + 1; i <= start + beamReward.DROP1; i++) {
                const reward = beamReward.calculate(i);
                assert.strictEqual(reward, 25);
            }
        });

        it('should return correct value during 3rd drop in value', () => {
            const start = beamReward.DROP0 + (beamReward.DROP1 * 2);
            for (let i = start + 1; i <= start + beamReward.DROP1; i++) {
                const reward = beamReward.calculate(i);
                assert.strictEqual(reward, 12);
            }
        });

        it('should return correct value during 4th drop in value', () => {
            const start = beamReward.DROP0 + (beamReward.DROP1 * 3);
            for (let i = start + 1; i <= start + beamReward.DROP1; i++) {
                const reward = beamReward.calculate(i);
                assert.strictEqual(reward, 6);
            }
        });

        it('should return correct value during 5th drop in value', () => {
            const start = beamReward.DROP0 + (beamReward.DROP1 * 4);
            for (let i = start + 1; i <= start + beamReward.DROP1; i++) {
                const reward = beamReward.calculate(i);
                assert.strictEqual(reward, 3);
            }
        });

        it('should return correct value during 5th drop in value', () => {
            const start = beamReward.DROP0 + (beamReward.DROP1 * 4);
            for (let i = start + 1; i <= start + beamReward.DROP1; i++) {
                const reward = beamReward.calculate(i);
                assert.strictEqual(reward, 3);
            }
        });

        it('should return correct value during 6th drop in value', () => {
            const start = beamReward.DROP0 + (beamReward.DROP1 * 5);
            for (let i = start + 1; i <= start + beamReward.DROP1; i++) {
                const reward = beamReward.calculate(i);
                assert.strictEqual(reward, 1);
            }
        });

        it('should return correct value after 7th drop in value', () => {
            const start = beamReward.DROP0 + (beamReward.DROP1 * 6);
            for (let i = start + 1; i <= start + beamReward.DROP1; i++) {
                const reward = beamReward.calculate(i);
                assert.strictEqual(reward, 0);
            }
        });
    });
});