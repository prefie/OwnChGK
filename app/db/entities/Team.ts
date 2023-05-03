import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToMany } from 'typeorm';
import { User } from './User';
import { BigGame } from './BigGame';
import { BaseCreature } from './BaseCreature';

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
        unique: true
    })
    name: string;

    @OneToOne(
        () => User,
        user => user.team,
        {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        })
    @JoinColumn({
        name: 'captain_id'
    })
    captain: User;

    @ManyToMany(
        () => BigGame,
        bigGame => bigGame.teams
    )
    bigGames: BigGame[];

    @Column('json', {
        nullable: true
    })
    participants: Participant[];
}