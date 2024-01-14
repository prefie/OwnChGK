import { BigGame } from '../db/entities/big-game';
import { Game, GameStatus, GameType } from '../db/entities/game';
import { RoundType } from '../db/entities/round.js';

export class GameDto {
    public readonly type: GameType;
    public readonly roundsCount: number;
    public readonly questionsCount: number;
    public readonly questions: Record<number, string[]> | undefined;

    constructor(game: Game, withQuestions: boolean = false) {
        this.type = game.type as GameType;
        this.roundsCount = game.rounds?.length ?? 0;
        this.questionsCount = this.roundsCount !== 0 ? game.rounds[0].questions.length : 0;
        if (withQuestions) {
            const questions: Record<number, string[]> = {};
            for (let i = 0; i < this.roundsCount; i++) {
                questions[i + 1] = game.rounds[i].questions.sort((a, b) => (a.number > b.number ? 1 : -1)).map(q => q.text);
            }
            this.questions = questions;
        }
    }
}

export class MatrixGameDto extends GameDto {
    public readonly roundNames: string[];

    constructor(game: Game, withQuestions: boolean = false) {
        super(game, withQuestions);

        this.roundNames =
            this.roundsCount !== 0 ? game.rounds.sort((a, b) => (a.number > b.number ? 1 : -1)).map(round => round.name) : [];
    }
}

export class QuizGameDto extends MatrixGameDto {
    public readonly roundTypes: RoundType[];

    constructor(game: Game, withQuestions: boolean = false) {
        super(game, withQuestions);

        this.roundTypes = game.rounds?.sort((a, b) => (a.number > b.number ? 1 : -1)).map(round => round.type) ?? [];
    }
}

export class BigGameDto {
    public readonly name: string;
    public readonly id: string;
    public readonly accessLevel: string;
    public readonly amIParticipate: boolean;
    public readonly teamsCount: number;
    public readonly status: GameStatus;
    public readonly games: GameDto[];

    constructor(game: BigGame, currentTeamId?: string | undefined) {
        this.name = game.name;
        this.id = game.id.toString();
        this.accessLevel = game.accessLevel;
        this.teamsCount = game.teams?.length ?? 0;
        this.games = game.games?.map(g => new GameDto(g)) ?? [];
        this.status = game.status as GameStatus;

        const teamIds = game.teams.map(t => t.id);
        this.amIParticipate = !!(currentTeamId && teamIds.indexOf(currentTeamId) != -1);
    }
}
