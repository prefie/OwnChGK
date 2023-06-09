import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    ManyToMany,
} from 'typeorm';
import { Person } from './person';
import { BigGame } from './big-game';

export enum AdminRoles {
    ADMIN = 'admin',
    SUPERADMIN = 'superadmin',
    DEMOADMIN = 'demoadmin',
}

@Entity('admins')
export class Admin extends Person {
    @PrimaryGeneratedColumn('uuid', { name: 'admin_id' })
    id: string;

    @Column({
        type: 'enum',
        enum: AdminRoles,
        default: AdminRoles.ADMIN
    })
    role: AdminRoles;

    @OneToMany(
        () => BigGame,
        game => game.admin
    )
    bigGames: BigGame[];

    @ManyToMany(
        () => BigGame,
        game => game.additionalAdmins,
        {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        }
    )
    additionalBigGames: BigGame[];
}