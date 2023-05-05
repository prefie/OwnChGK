import { Admin } from '../entities/Admin';
import { AppDataSource } from '../../data-source';
import { BaseRepository } from './baseRepository';

export class AdminRepository extends BaseRepository<Admin> {
    constructor() {
        super(AppDataSource.getRepository(Admin));
    }

    findByEmail(email: string) {
        return this.innerRepository.findOneBy({ email: email.toLowerCase() });
    }

    insertByEmailAndPassword(email: string, password: string, name: string = null) {
        const admin = new Admin();
        admin.email = email.toLowerCase();
        admin.password = password;
        admin.name = name ?? null;

        return this.innerRepository.save(admin);
    }

    async updateByEmailAndPassword(email: string, password: string) {
        const admin = await this.innerRepository.findOneBy({ email: email.toLowerCase() });
        admin.password = password;

        return this.innerRepository.save(admin);
    }

    deleteByEmail(email: string) {
        return this.innerRepository.delete({ email: email.toLowerCase() });
    }
}
