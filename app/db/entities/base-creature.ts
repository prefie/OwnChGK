import { BaseEntity, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';

@Entity()
export abstract class BaseCreature extends BaseEntity {
    id: string;

    @CreateDateColumn({
        name: 'created_date'
    })
    createdDate: Date;

    @UpdateDateColumn({
        name: 'updated_date'
    })
    updatedDate: Date;
}