import { AnswerStatus } from '../db/entities/answer';
import { Appeal } from './appeal';

export class Answer {
    public readonly teamId: string;
    public readonly text: string;
    public readonly roundNumber: number;
    public readonly questionNumber: number;
    private _appeal: Appeal;
    private _score: number;
    private _status: AnswerStatus;

    constructor(
        teamId: string,
        roundNumber: number,
        questionNumber: number,
        text: string,
        status: AnswerStatus = AnswerStatus.UNCHECKED,
        score: number = 0,
    ) {
        this.teamId = teamId;
        this.roundNumber = roundNumber;
        this.questionNumber = questionNumber;
        this.text = text;
        this._status = AnswerStatus.UNCHECKED;
        this._score = score;
        this._status = status;
    }

    get status() {
        return this._status;
    }

    get score() {
        return this._score;
    }

    get appeal() {
        return this._appeal;
    }

    accept(score: number): void {
        this._status = AnswerStatus.RIGHT;
        this._score = score;
    }

    reject(score: number): void {
        this._status = AnswerStatus.WRONG;
        this._score = -score;
    }

    onAppeal(appeal: Appeal): void {
        this._appeal = appeal;
        this._status = AnswerStatus.ON_APPEAL;
    }
}
