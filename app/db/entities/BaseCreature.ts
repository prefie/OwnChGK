import { BaseEntity } from 'typeorm';

export abstract class BaseCreature extends BaseEntity {
    id: string;
}