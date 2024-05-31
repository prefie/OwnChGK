export interface GamePartSettings {
    roundsCount: number;
    questionsCount: number;
    questions?: Record<number, string[]> | undefined;
    roundNames?: string[];
    roundTypes?: RoundType[];
}

export enum RoundType {
    NORMAL = 'normal',
    BLITZ = 'blitz'
}

export interface AnswerQuizType {
    answer: string;
    blitz: boolean;
}

export const roundTypeToBool = (type: RoundType) => {
    return type === RoundType.BLITZ;
};

export enum AnswerStatus {
    RIGHT = 'right',
    WRONG = 'wrong',
    UNCHECKED = 'unchecked',
    ON_APPEAL = 'on_appeal'
}
