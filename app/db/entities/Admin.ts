import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany } from 'typeorm';
import { Person } from './Person';
import { BigGame } from './BigGame';

export enum AdminRoles {
    ADMIN = 'admin',
    SUPERADMIN = 'superadmin'
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
    role: string;

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