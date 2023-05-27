import { FindManyOptions, Repository } from 'typeorm';
import { BaseCreature } from '../entities/base-creature';

export class BaseRepository<Entity extends BaseCreature> {
    protected readonly innerRepository: Repository<Entity>;

    constructor(innerRepository: Repository<Entity>) {
        this.innerRepository = innerRepository;
    }

    find() {
        return this.innerRepository.find();
    }

    findById(id: string) {
        const findOptions: FindManyOptions<BaseCreature> = { where: { id } };
        return this.innerRepository.findOne(findOptions as FindManyOptions<Entity>);
    }

    deleteById(id: string) {
        return this.innerRepository.delete(id);
    }
}