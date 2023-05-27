import { Question } from './question';
import { GameTypeLogic } from './enums/game-type-logic.enum';

export class Round {
    public readonly number: number;
    public readonly questions: Question[];
    public readonly questionsCount: number;
    public readonly questionTime: number;
    public readonly gameType: GameTypeLogic;

    constructor(
        number: number,
        questionsCount: number,
        questionTime: number,
        gameType = GameTypeLogic.ChGK,
        questions?: Record<number, string[]> | undefined,
    ) {
        this.gameType = gameType;
        this.questionsCount = questionsCount;
        this.questionTime = questionTime;
        this.number = number;
        this.questions = this.createQuestions(questions);
    }

    createQuestions(questions: Record<number, string[]> | undefined): Question[] {
        const result = [];
        for (let i = 1; i <= this.questionsCount; i++) {
            result.push(
                new Question(
                    this.gameType == GameTypeLogic.ChGK ? 1 : i * 10,
                    this.number,
                    i,
                    this.questionTime,
                    questions ? questions[this.number][i - 1] : null
                )
            );
        }

        return result;
    }
}
