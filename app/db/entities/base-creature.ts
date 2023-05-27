import { BaseEntity, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';

@Entity()
export abstract class BaseCreature extends BaseEntity {
    id: string;

    @CreateDateColumn()
    createdDate: Date;

    @UpdateDateColumn()
    updatedDate: Date;
}