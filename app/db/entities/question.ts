import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Round } from './round';
import { BaseCreature } from './base-creature';
import { Answer } from './answer';

@Entity('questions')
export class Question extends BaseCreature {
    @PrimaryGeneratedColumn('uuid', { name: 'question_id' })
    id: string;

    @Column()
    number: number;

    @Column({
        nullable: true
    })
    text: string | null;

    @Column()
    cost: number;

    @ManyToOne(
        () => Round,
        {
            nullable: false,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
    @JoinColumn({
        name: 'round_id',
    })
    round: Round;

    @OneToMany(
        () => Answer,
        answer => answer.question
    )
    answers: Answer[];
}