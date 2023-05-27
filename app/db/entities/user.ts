import { Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Person } from './person';
import { Team } from './team';

@Entity('users')
export class User extends Person {
    @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
    id: string;

    @OneToOne(
        () => Team,
        team => team.captain,
    )
    team: Team;
}