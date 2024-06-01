export interface GamePartSettings {
    roundsCount: number;
    questionsCount: number;
    questions?: Record<number, string[]> | undefined;
    roundNames?: string[];
}

export enum AnswerStatus {
    RIGHT = 'right',
    WRONG = 'wrong',
    UNCHECKED = 'unchecked',
    ON_APPEAL = 'on_appeal',
}
