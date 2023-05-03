import { User } from '../entities/User';
import { AppDataSource } from '../../data-source';
import { BaseRepository } from './baseRepository';

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
            where: { email: email },
            relations: { team: true }
        });
    }

    findUsersWithoutTeam() {
        return this.innerRepository.find({
            where: { team: null },
            relations: { team: true }
        });
    }

    insertByEmailAndPassword(email: string, password: string) {
        const user = new User();
        user.email = email;
        user.password = password;

        return this.innerRepository.save(user);
    }

    async updateByEmailAndPassword(email: string, password: string) {
        const user = await this.innerRepository.findOneBy({ email });
        user.password = password;

        return this.innerRepository.save(user);
    }
}
