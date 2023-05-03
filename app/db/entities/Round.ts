import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Game } from './Game';
import { Question } from './Questions';
import { BaseCreature } from './BaseCreature';

@Entity('rounds')
export class Round extends BaseCreature {
    @PrimaryGeneratedColumn('uuid', { name: 'round_id' })
    id: string;

    @Column()
    number: number;

    @Column({
        nullable: true
    })
    name: string;

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