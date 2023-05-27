import { AppealStatus } from '../db/entities/appeal';

export class Appeal {
    public readonly teamId: string;
    public readonly text: string;
    public readonly roundNumber: number;
    public readonly questionNumber: number;
    public readonly wrongAnswer: string;
    private _comment: string;
    private _status: AppealStatus;

    constructor(teamId: string, roundNumber: number, questionNumber: number, text: string, wrongAnswer: string) {
        this.teamId = teamId;
        this.roundNumber = roundNumber;
        this.questionNumber = questionNumber;
        this.text = text;
        this._status = AppealStatus.UNCHECKED;
        this.wrongAnswer = wrongAnswer;
        this._comment = '';
    }

    public get status() {
        return this._status;
    }

    public get comment() {
        return this._comment;
    }

    accept(comment: string): void {
        this._status = AppealStatus.ACCEPTED;
        this._comment = comment;
    }

    reject(comment: string): void {
        this._comment = comment;
        this._status = AppealStatus.NOT_ACCEPTED;
    }
}