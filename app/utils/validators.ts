import { RoundType } from '../db/entities/round.js';
import { GameStatus } from '../db/entities/game';
import { AccessLevel } from '../db/entities/big-game';

export const validateGameStatus = (value: any) => {
    return Object.values(GameStatus).includes(value);
};

export const validateAccessLevel = (value: any) => {
    return Object.values(AccessLevel).includes(value);
};

export const validateRoundTypes = (value: any[]) => {
    const objectValues = Object.values(RoundType);
    for (const v of value) {
        if (!objectValues.includes(v)) return false;
    }

    return true;
};
