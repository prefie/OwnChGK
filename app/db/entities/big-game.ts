import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { Game, GameStatus } from './game';
import { Admin } from './admin';
import { Team } from './team';
import { BaseCreature } from './base-creature';

export enum AccessLevel {
    PUBLIC = 'public',
    PRIVATE = 'private',
}

@Entity('big_games')
export class BigGame extends BaseCreature {
    @PrimaryGeneratedColumn('uuid', { name: 'big_game_id' })
    id: string;

    @Column({
        unique: true,
    })
    name: string;

    @Column({
        type: 'enum',
        enum: GameStatus,
        default: GameStatus.NOT_STARTED,
    })
    status: GameStatus;

    @Column({
        name: 'access_level',
        type: 'enum',
        enum: AccessLevel,
        default: AccessLevel.PRIVATE,
    })
    accessLevel: string;

    @OneToMany(() => Game, game => game.bigGame, {
        cascade: true,
    })
    games: Game[];

    @ManyToOne(() => Admin, {
        nullable: false,
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({
        name: 'admin_id',
    })
    admin: Admin;

    @ManyToMany(() => Admin, admin => admin.additionalBigGames, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinTable({
        name: 'big_game_admin_links',
        joinColumn: {
            name: 'big_game_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'admin_id',
            referencedColumnName: 'id',
        },
    })
    additionalAdmins: Admin[];

    @ManyToMany(() => Team, team => team.bigGames, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinTable({
        name: 'big_game_team_links',
        joinColumn: {
            name: 'big_game_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'team_id',
            referencedColumnName: 'id',
        },
    })
    teams: Team[];
}
