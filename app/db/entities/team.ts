import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToMany, OneToMany } from 'typeorm';
import { User } from './user';
import { BigGame } from './big-game';
import { BaseCreature } from './base-creature';
import { Answer } from './answer';

export class Participant {
    name: string;
    email: string;

    constructor(email?: string, name?: string) {
        this.email = email;
        this.name = name;
    }
}

@Entity('teams')
export class Team extends BaseCreature {
    @PrimaryGeneratedColumn('uuid', { name: 'team_id' })
    id: string;

    @Column({
        unique: true,
    })
    name: string;

    @OneToOne(() => User, user => user.team, {
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({
        name: 'captain_id',
    })
    captain: User;

    @ManyToMany(() => BigGame, bigGame => bigGame.teams, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    bigGames: BigGame[];

    @Column('json', {
        nullable: true,
    })
    participants: Participant[];

    @OneToMany(() => Answer, answer => answer.team)
    answers: Answer[];
}
