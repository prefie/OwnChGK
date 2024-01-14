import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Game } from './game';
import { Question } from './question';
import { BaseCreature } from './base-creature';

export enum RoundType {
    NORMAL = 'normal',
    BLITZ = 'blitz',
}

@Entity('rounds')
export class Round extends BaseCreature {
    @PrimaryGeneratedColumn('uuid', { name: 'round_id' })
    id: string;

    @Column()
    number: number;

    @Column({
        nullable: true,
    })
    name: string;

    @Column({
        name: 'questions_time',
    })
    questionTime: number;

    @Column({
        type: 'enum',
        enum: RoundType,
        default: RoundType.NORMAL,
    })
    type: RoundType;

    @OneToMany(() => Question, question => question.round, {
        cascade: true,
    })
    questions: Question[];

    @ManyToOne(() => Game, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({
        name: 'game_id',
    })
    game: Game;
}
