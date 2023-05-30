import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Game } from './game';
import { Question } from './question';
import { BaseCreature } from './base-creature';

@Entity('rounds')
export class Round extends BaseCreature {
    @PrimaryGeneratedColumn('uuid', { name: 'round_id' })
    id: string;

    @Column()
    number: number;

    @Column({
        nullable: true
    })
    name: string | null;

    @Column({
        name: 'questions_time'
    })
    questionTime: number;

    @OneToMany(
        () => Question,
        question => question.round
    )
    questions: Question[];

    @ManyToOne(
        () => Game,
        {
            nullable: false,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
    @JoinColumn({
        name: 'game_id',
    })
    game: Game;
}