import { BaseCreature } from './base-creature';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Team } from './team';
import { Question } from './questions';
import { Appeal } from './appeal';

export enum AnswerStatus {
    RIGHT = 'right',
    WRONG = 'wrong',
    UNCHECKED = 'unchecked',
    ON_APPEAL = 'on_appeal'
}

@Entity('answers')
export class Answer extends BaseCreature {
    @PrimaryGeneratedColumn('uuid', { name: 'answer_id' })
    id: string;

    @Column()
    text: string;

    @Column({
            default: 0
        }
    )
    score: number;

    @Column({
        type: 'enum',
        enum: AnswerStatus,
        default: AnswerStatus.UNCHECKED
    })
    status: string;

    @ManyToOne(
        () => Team,
        {
            nullable: false,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        }
    )
    @JoinColumn({
            name: 'team_id',
        }
    )
    team: Team;

    @ManyToOne(
        () => Question,
        {
            nullable: false,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        }
    )
    @JoinColumn({
            name: 'question_id',
        }
    )
    question: Question;

    @OneToOne(
        () => Appeal,
        appeal => appeal.answer,
    )
    appeal: Appeal;
}