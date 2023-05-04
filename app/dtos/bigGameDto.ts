import { BigGame } from '../db/entities/BigGame';
import { Game, GameStatus, GameType } from '../db/entities/Game';

class GameDtoInternal {
    public readonly type: GameType;
    public readonly roundsCount: number;
    public readonly questionsCount: number;

    constructor(game: Game) {
        this.type = game.type as GameType;
        this.roundsCount = game.rounds?.length ?? 0;
        this.questionsCount = this.roundsCount !== 0 ? game.rounds[0].questions.length : 0;
    }
}

export class BigGameDto {
    public readonly name: string;
    public readonly id: string;
    public readonly teamsCount: number;
    public readonly status: GameStatus;
    public readonly games: GameDtoInternal[];

    constructor(game: BigGame) {
        this.name = game.name;
        this.id = game.id.toString();
        this.teamsCount = game.teams?.length ?? 0;
        this.games = game.games?.map(g => new GameDtoInternal(g)) ?? [];
        this.status = game.status as GameStatus;
    }
}
