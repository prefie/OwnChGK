import {Team} from "./Team";
import {Question} from "./Question";


export class Round {
    public readonly number: number;
    public readonly questions: Question[]; // TODO: public?
    public readonly questionsCount: number;
    public readonly questionTime: number;
    public readonly questionCost: number;

    constructor(number: number, questionsCount: number, questionTime: number, questionCost: number) {
        this.questionCost = questionCost;
        this.questionsCount = questionsCount;
        this.questionTime = questionTime;
        this.number = number;
        this.questions = this.createQuestions();
    }

    createQuestions(): Question[] {
        const result = [];
        for (let i = 1; i <= this.questionsCount; i++) {
            result.push(new Question(this.questionCost, this.number, i, this.questionTime));
        }
        return result;
    }
}

export enum GameStatus {
    IsOnBreak,
    Start
}

export class Game {
    public readonly id: number;
    public readonly name: string;
    public readonly rounds: Round[]; // TODO: public?
    public readonly teams: { [name: number]: Team }; // TODO: public?
    public status: GameStatus;
    public breakTime: number;
    private interval: any;

    constructor(name: string) {
        this.id = Math.round(Math.random() * 1000000)
        this.name = name;
        this.rounds = [];
        this.teams = {};
        this.status = GameStatus.Start;
        this.breakTime = 0;
    }

    startBreak(time: number): void {
        this.status = GameStatus.IsOnBreak;
        this.breakTime = time;
        this.interval = setInterval(() => {
            if (this.breakTime === 0) {
                this.stopBreak();
            } else {
                this.breakTime -= 1;
                console.log(this.breakTime);
            }
        }, 1000, this);
    }

    stopBreak(): void {
        clearInterval(this.interval);
        this.status = GameStatus.Start;
        this.breakTime = 0;
    }

    addTeam(team: Team): void {
        this.teams[team.id] = team;
    }

    addRound(round: Round): void {
        this.rounds.push(round);
    }

    getScoreTable(): [{name:string, scoreTable: number[][]}] {
        const table = [];
        for (let teamId in this.teams) {
            // @ts-ignore
            table.push({name: this.teams[teamId].name, scoreTable: this.teams[teamId].getScoreTable()});
        }
        // @ts-ignore
        return table;
    }

    getTotalScoreForAllTeams(): [{name:string, score:number}] {
        const table = [];
        for (let teamId in this.teams) {
            // @ts-ignore
            table.push({name: this.teams[teamId].name, score: this.teams[teamId].getTotalScore()});
        }
        // @ts-ignore
        return table;
    }
}
