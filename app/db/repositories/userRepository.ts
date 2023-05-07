import { User } from '../entities/User';
import { AppDataSource } from '../../utils/data-source';
import { BaseRepository } from './baseRepository';
import { IsNull } from 'typeorm';

export class UserRepository extends BaseRepository<User> {
    constructor() {
        super(AppDataSource.getRepository(User));
    }

    findById(userId: string) {
        return this.innerRepository.findOne({
            where: { id: userId },
            relations: { team: true }
        });
    }

    findByEmail(email: string) {
        return this.innerRepository.findOne({
            where: { email: email.toLowerCase() },
            relations: { team: true }
        });
    }

    findUsersWithoutTeam() {
        return this.innerRepository.find({
            where: { team: { id: IsNull() } },
            relations: { team: true }
        });
    }

    insertByEmailAndPassword(email: string, password: string) {
        const user = new User();
        user.email = email.toLowerCase();
        user.password = password;

        return this.innerRepository.save(user);
    }

    async updateByEmailAndPassword(email: string, password: string) {
        const user = await this.innerRepository.findOneBy({ email: email.toLowerCase() });
        user.password = password;

        return this.innerRepository.save(user);
    }
}
