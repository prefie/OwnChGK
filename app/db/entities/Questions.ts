import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Round } from './Round';
import { BaseCreature } from './BaseCreature';

@Entity('questions')
export class Question extends BaseCreature {
    @PrimaryGeneratedColumn('uuid', { name: 'question_id' })
    id: string;

    @Column()
    number: number;

    @Column({
        nullable: true
    })
    text: string;

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
}