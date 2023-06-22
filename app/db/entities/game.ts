import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Round } from './round';
import { BigGame } from './big-game';
import { BaseCreature } from './base-creature';

export enum GameStatus {
    NOT_STARTED = 'not_started',
    STARTED = 'started',
    FINISHED = 'finished'
}

export enum GameType {
    CHGK = 'chgk',
    MATRIX = 'matrix',
    QUIZ = 'quiz',
}

@Entity('games')
export class Game extends BaseCreature {
    @PrimaryGeneratedColumn('uuid', { name: 'game_id' })
    id: string;

    @Column({
        type: 'enum',
        enum: GameType,
        default: GameType.CHGK
    })
    type: GameType;

    @OneToMany(
        () => Round,
        round => round.game,
        {
            cascade: true,
        }
    )
    rounds: Round[];

    @ManyToOne(
        () => BigGame,
        {
            nullable: false,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
    @JoinColumn({
        name: 'big_game_id',
    })
    bigGame: BigGame;
}