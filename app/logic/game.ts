import { Team } from './team';
import { seconds20PerQuestion, seconds70PerQuestion } from '../socket';
import { Round } from './round';
import { GameTypeLogic } from './enums/game-type-logic.enum';


export class Game {
    public readonly id: string;
    public readonly name: string;
    public readonly rounds: Record<number, Round>; // нумерация ключей с 0
    public readonly teams: Record<string, Team>;
    public readonly type: GameTypeLogic;

    public currentQuestion: [number, number];
    public timerStarted: boolean;
    public timer: any;
    public leftTime: number;
    public maxTime: number;
    public timeIsOnPause: boolean;


    constructor(id: string, name: string, type: GameTypeLogic) {
        this.id = id;
        this.name = name;
        this.rounds = {};
        this.teams = {};
        this.currentQuestion = undefined;
        this.type = type;

        this.timerStarted = false;
        this.leftTime = type == GameTypeLogic.ChGK ? seconds70PerQuestion : seconds20PerQuestion;
        this.timeIsOnPause = false;
        this.maxTime = type == GameTypeLogic.ChGK ? seconds70PerQuestion : seconds20PerQuestion;
    }

    get roundValues(): Round[] {
        return Object.values(this.rounds);
    }

    get teamValues(): Team[] {
        return Object.values(this.teams);
    }

    addTeam(team: Team): void {
        this.teams[team.id] = team;
    }

    addRound(round: Round): void {
        this.rounds[round.number - 1] = round;
        const answers = round.questions.map(q => q.answers).reduce((arr, e) => arr.concat(e), []);
        for (let answer of answers) {
            this.teams[answer.teamId]?.addAnswer(answer);
        }
    }

    addRounds(rounds: Round[]): void {
        for (let round of rounds) {
            this.addRound(round);
        }
    }

    getRoundsCount() {
        return Object.keys(this.rounds).length;
    }

    getTeamDictionary(teamId: string): { [name: string]: string } {
        let result = {};
        result[this.teams[teamId].name] = teamId;
        return result;
    }

    getAllTeamsDictionary(): { [name: string]: string } {
        let result = {};
        for (let teamId of Object.keys(this.teams)) {
            result[this.teams[teamId].name] = teamId;
        }

        return result;
    }

    getScoreTable(): Record<string, number[][]> {
        let table = {};
        const roundsCount = this.getRoundsCount();
        const questionsCount = this.rounds[0].questions.length;

        for (let teamId of Object.keys(this.teams)) {
            table[this.teams[teamId].name] = new Array(roundsCount);
            for (let round = 0; round < roundsCount; round++) {
                table[this.teams[teamId].name][round] = new Array(questionsCount).fill(0);
            }
            const teamAnswers = this.teams[teamId].getAnswers();
            for (let answer of teamAnswers) {
                table[this.teams[teamId].name][answer.roundNumber - 1][answer.questionNumber - 1] = answer.score;
            }
        }
        return table;
    }

    getScoreTableForTeam(teamId: string): Record<string, number[][]> {
        let table = {};
        const roundsCount = this.getRoundsCount();
        const questionsCount = this.rounds[0].questions.length;

        table[this.teams[teamId].name] = new Array(roundsCount);
        for (let round = 0; round < roundsCount; round++) {
            table[this.teams[teamId].name][round] = new Array(questionsCount).fill(0);
        }
        const teamAnswers = this.teams[teamId].getAnswers();
        for (let answer of teamAnswers) {
            table[this.teams[teamId].name][answer.roundNumber - 1][answer.questionNumber - 1] = answer.score;
        }
        return table;
    }

    getTotalScoreForAllTeams(): Record<string, number> {
        const table = {};
        for (let teamId in this.teams) {
            table[this.teams[teamId].name] = this.teams[teamId].getTotalScore();
        }
        return table;
    }
}
