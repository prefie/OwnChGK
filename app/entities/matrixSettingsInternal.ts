import { ChgkSettingsInternal } from './chgkSettingsInternal';
import { Game } from '../db/entities/Game';

export class MatrixSettingsInternal extends ChgkSettingsInternal {
    public readonly roundNames: string[];

    constructor(game: Game) {
        super(game);
        this.roundNames = this.roundsCount !== 0
            ? game.rounds
                .sort((a, b) => a.number > b.number ? 1 : -1)
                .map(round => round.name)
            : [];
    }
}