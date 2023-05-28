import { BaseCreature } from './base-creature';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Answer } from './answer';

export enum AppealStatus {
    UNCHECKED = 'unchecked',
    ACCEPTED = 'accepted',
    NOT_ACCEPTED = 'not_accepted'
}

@Entity("appeals")
export class Appeal extends BaseCreature {
    @PrimaryGeneratedColumn('uuid', { name: 'appeal_id' })
    id: string;

    @Column()
    text: string;

    @Column()
    comment: string;

    @Column({
        type: 'enum',
        enum: AppealStatus,
        default: AppealStatus.UNCHECKED
    })
    status: string;

    @OneToOne(
        () => Answer,
        answer => answer.appeal,
        {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        })
    @JoinColumn({
        name: 'answer_id'
    })
    answer: Answer;
}