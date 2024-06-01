import { Team } from './team';
import { Answer } from './answer';
import { Appeal } from './appeal';
import { AnswerStatus } from '../db/entities/answer';

export class Question {
    public readonly id: string;
    public readonly cost: number;
    public readonly number: number;
    public readonly time: number;
    public readonly roundNumber: number;
    public readonly text: string;

    private readonly _answers: Record<string, Answer>;
    private readonly _appeals: Record<string, Appeal>;

    constructor(
        id: string,
        cost: number,
        roundNumber: number,
        number: number,
        time: number,
        text: string = null,
        answers?: Answer[] | undefined,
        appeals?: Appeal[] | undefined,
    ) {
        this.id = id;
        this.cost = cost;
        this.roundNumber = roundNumber;
        this.number = number;
        this.time = time;
        this.text = text;
        this._answers = answers ? Question.mapAnswersToRecord(answers) : {};
        this._appeals = appeals ? Question.mapAppealsToRecord(appeals) : {};
    }

    get answers(): Answer[] {
        return Object.values(this._answers);
    }

    get appeals(): Appeal[] {
        return Object.values(this._appeals);
    }

    giveAnswer(team: Team, text: string): void {
        this._answers[team.id] = new Answer(team.id, this.roundNumber, this.number, text);
        team.addAnswer(this._answers[team.id]);
    }

    giveAppeal(teamId: string, text: string, wrongAnswer: string): void {
        this._appeals[teamId] = new Appeal(teamId, this.roundNumber, this.number, text, wrongAnswer);
        this._answers[teamId].onAppeal(this._appeals[teamId]);
    }

    changeAnswer(team: Team, roundNumber: number, questionNumber: number, isMatrixType = false): void {
        let answer = this._answers[team.id];
        if (answer) {
            answer.status == AnswerStatus.RIGHT
                ? answer.reject(isMatrixType ? this.cost : 0)
                : answer.accept(this.cost);
        } else {
            answer = new Answer(team.id, this.roundNumber, this.number, '');
            this._answers[team.id] = answer;
            answer.accept(this.cost);
            team.addAnswer(answer);
        }
    }

    acceptAnswers(rightAnswer: string): void {
        for (let teamId of Object.keys(this._answers)) {
            if (this._answers[teamId].text == rightAnswer) {
                this._answers[teamId].accept(this.cost);
            }
        }
    }

    rejectAnswers(wrongAnswer: string, isMatrixType = false): void {
        for (let teamId of Object.keys(this._answers)) {
            if (this._answers[teamId].text == wrongAnswer) {
                isMatrixType ? this._answers[teamId].reject(this.cost) : this._answers[teamId].reject(0);
            }
        }
    }

    acceptAppeal(answer: string, comment: string = ''): void {
        const appeals = Object.values(this._appeals).filter(value => value.wrongAnswer == answer);

        for (const appeal of appeals) {
            appeal.accept(comment);
        }

        this.acceptAnswers(answer);
    }

    rejectAppeal(answer: string, comment: string = ''): void {
        const appeals = Object.values(this._appeals).filter(value => value.wrongAnswer == answer);

        for (const appeal of appeals) {
            appeal.reject(comment);
        }

        this.rejectAnswers(answer);
    }

    private static mapAnswersToRecord(answers: Answer[]): Record<string, Answer> {
        const answersWrapper: Record<string, Answer> = {};

        for (let answer of answers) {
            answersWrapper[answer.teamId] = answer;
        }

        return answersWrapper;
    }

    private static mapAppealsToRecord(appeals: Appeal[]): Record<string, Appeal> {
        const appealsWrapper: Record<string, Appeal> = {};

        for (let appeal of appeals) {
            appealsWrapper[appeal.teamId] = appeal;
        }

        return appealsWrapper;
    }
}
