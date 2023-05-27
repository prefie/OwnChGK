import { AnswerStatus } from '../db/entities/answer';

export class Answer {
    public readonly teamId: string;
    public readonly text: string;
    public readonly roundNumber: number;
    public readonly questionNumber: number;
    private _score: number;
    private _status: AnswerStatus;

    constructor(teamId: string, roundNumber: number, questionNumber: number, text: string) {
        this.teamId = teamId;
        this.roundNumber = roundNumber;
        this.questionNumber = questionNumber;
        this.text = text;
        this._status = AnswerStatus.UNCHECKED;
        this._score = 0;
    }

    public get status() {
        return this._status;
    }

    public get score() {
        return this._score;
    }

    accept(score: number): void {
        this._status = AnswerStatus.RIGHT;
        this._score = score;
    }

    reject(score: number): void {
        this._status = AnswerStatus.WRONG;
        this._score = -score;
    }

    onAppeal(): void {
        this._status = AnswerStatus.ON_APPEAL;
    }
}
