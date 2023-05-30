import { Game } from './game';
import { GameStatus } from './enums/game-status.enum';


export class BigGameLogic {
    public readonly id: string;
    public readonly name: String;
    public readonly chGKGame: Game | undefined;
    public readonly matrixGame: Game | undefined;

    public currentGame: Game | undefined;
    public intrigueEnabled: boolean;

    private _status: GameStatus;
    private _breakTime: number;
    private _intervalForBreak: NodeJS.Timer | undefined;

    constructor(
        id: string,
        name: String,
        ChGK: Game | undefined = undefined,
        Matrix: Game | undefined = undefined,
        intrigueEnabled: boolean = false
    ) {
        this.id = id;
        this.matrixGame = Matrix;
        this.chGKGame = ChGK;
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
        return this.matrixGame && this.chGKGame;
    }

    startBreak(time: number): void {
        this._status = GameStatus.IsOnBreak;
        this._breakTime = time;
        let self = this;
        this._intervalForBreak = setInterval(() => {
            if (self._breakTime == 0) {
                self.stopBreak();
            } else {
                self._breakTime -= 1;
            }
        }, 1000);
    }

    stopBreak(): void {
        clearInterval(this._intervalForBreak);
        this._status = GameStatus.Start;
        this._breakTime = 0;
    }
}