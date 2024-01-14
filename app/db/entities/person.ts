import { Entity, Column } from 'typeorm';
import { BaseCreature } from './base-creature';

@Entity()
export abstract class Person extends BaseCreature {
    @Column({
        unique: true,
    })
    email: string;

    @Column()
    password: string;

    @Column({
        nullable: true,
    })
    name: string;

    @Column({
        nullable: true,
    })
    temporary_code: string;
}
