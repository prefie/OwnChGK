import { Game } from './game';
import { GameStatus } from './enums/game-status.enum';


export class BigGameLogic {
    public readonly id: string;
    public readonly name: String;
    public readonly chGKGame: Game;
    public readonly matrixGame: Game;
    public readonly quizGame: Game;

    public currentGame: Game;
    public intrigueEnabled: boolean;

    private _status: GameStatus;
    private _breakTime: number;
    private _intervalForBreak: number;

    constructor(
        id: string,
        name: String,
        ChGK: Game = null,
        Matrix: Game = null,
        Quiz: Game = null,
        intrigueEnabled: boolean = false
    ) {
        this.id = id;
        this.matrixGame = Matrix;
        this.chGKGame = ChGK;
        this.quizGame = Quiz;
        this.name = name;
        this.currentGame = this.matrixGame ?? this.chGKGame;
        this.intrigueEnabled = intrigueEnabled;

        this._status = GameStatus.Start;
        this._breakTime = 0;
    }

    get status(): GameStatus {
        return this._status;
    }

    get breakTime(): number {
        return this._breakTime;
    }

    isFullGame() {
        return this.matrixGame && this.chGKGame && this.quizGame;
    }

    startBreak(time: number): void {
        this._status = GameStatus.IsOnBreak;
        this._breakTime = time;
        this._intervalForBreak = setInterval(() => {
            if (this._breakTime == 0) {
                this.stopBreak();
            } else {
                this._breakTime -= 1;
            }
        }, 1000, this);
    }

    stopBreak(): void {
        clearInterval(this._intervalForBreak);
        this._status = GameStatus.Start;
        this._breakTime = 0;
    }
}