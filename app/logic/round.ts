import { Question } from './question';
import { GameTypeLogic } from './enums/game-type-logic.enum';

export class Round {
    public readonly id: string;
    public readonly number: number;
    public readonly name: string;
    public readonly questions: Question[];
    public readonly questionsCount: number;
    public readonly questionTime: number;
    public readonly gameType: GameTypeLogic;
    public readonly isBlitz: boolean;

    constructor(
        id: string,
        number: number,
        name: string,
        questionsCount: number,
        questionTime: number,
        gameType = GameTypeLogic.ChGK,
        questions?: Question[] | undefined,
        isBlitz = false
    ) {
        this.id = id;
        this.gameType = gameType;
        this.questionsCount = questionsCount;
        this.questionTime = questionTime;
        this.number = number;
        this.name = name;
        this.questions = questions ?? this.createQuestions();
        this.isBlitz = isBlitz;
    }

    createQuestions(): Question[] {
        const result = [];
        for (let i = 1; i <= this.questionsCount; i++) {
            result.push(
                new Question(
                    'fake-id',
                    this.gameType == GameTypeLogic.ChGK ? 1 : i * 10,
                    this.number,
                    i,
                    this.questionTime,
                    null
                )
            );
        }

        return result;
    }
}
