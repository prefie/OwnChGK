import { Answer } from './answer';

export class Team {
    public readonly name: string;
    public readonly id: string;
    private readonly _answers: Record<number, Record<number, Answer>>;

    constructor(name: string, id: string, answers?: Answer[] | undefined) {
        this.name = name;
        this.id = id;
        this._answers = {};
    }

    addAnswer(answer: Answer): void {
        if (!this._answers[answer.roundNumber]) {
            this._answers[answer.roundNumber] = {};
        }

        this._answers[answer.roundNumber][answer.questionNumber] = answer;
    }

    getAnswers(): Answer[] {
        const answersByRounds = Object.values(this._answers);
        return answersByRounds
            .map(e => Object.values(e))
            .reduce((arr, e) => arr.concat(e), []);
    }

    getTotalScore(): number {
        let sum = 0;
        for (const answer of this.getAnswers()) {
            sum += answer.score;
        }
        return sum;
    }

    getAnswer(roundNumber: number, questionNumber: number): Answer | undefined {
        return this._answers[roundNumber] ? this._answers[roundNumber][questionNumber] : undefined;
    }
}