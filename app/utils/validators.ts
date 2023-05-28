import { Participant } from '../db/entities/team';
import { validateEmail } from './email';
import { GameStatus } from '../db/entities/game';
import { AccessLevel } from '../db/entities/big-game';

export const validateParticipants = (value: any) => {
    try {
        const participants = value as Participant[];
        for (const item of participants) {
            const participant = item as Participant;
            if (typeof participant.email !== 'string' || !validateEmail(participant.email) || typeof participant.name !== 'string') {
                return false;
            }
        }
        return true;
    } catch {
        return false;
    }
};

export const validateGameStatus = (value: any) => {
    return Object.values(GameStatus).includes(value);
};

export const validateAccessLevel = (value: any) => {
    return Object.values(AccessLevel).includes(value);
}