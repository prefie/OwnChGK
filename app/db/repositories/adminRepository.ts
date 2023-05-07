import { Admin, AdminRoles } from '../entities/Admin';
import { AppDataSource } from '../../utils/data-source';
import { BaseRepository } from './baseRepository';

export class AdminRepository extends BaseRepository<Admin> {
    constructor() {
        super(AppDataSource.getRepository(Admin));
    }

    findByEmail(email: string) {
        return this.innerRepository.findOneBy({ email: email.toLowerCase() });
    }

    insertByEmailAndPassword(email: string, password: string, name: string = null, role: AdminRoles = AdminRoles.ADMIN) {
        const admin = new Admin();
        admin.email = email.toLowerCase();
        admin.password = password;
        admin.name = name ?? null;
        admin.role = role;

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
