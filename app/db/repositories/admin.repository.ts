import { Admin, AdminRoles } from '../entities/admin';
import { AppDataSource } from '../../utils/data-source';
import { BaseRepository } from './base.repository';

export class AdminRepository extends BaseRepository<Admin> {
    constructor() {
        super(AppDataSource.getRepository(Admin));
    }

    findByEmail(email: string) {
        return this.innerRepository.findOneBy({ email: email.toLowerCase() });
    }

    insertByEmailAndPassword(
        email: string,
        password: string,
        name: string | null = null,
        role: AdminRoles = AdminRoles.ADMIN
    ) {
        const admin = new Admin();
        admin.email = email.toLowerCase();
        admin.password = password;
        admin.name = name ?? null;
        admin.role = role;

        return this.innerRepository.save(admin);
    }

    async updateByEmailAndPassword(email: string, password: string) {
        const admin = await this.innerRepository.findOneBy({ email: email.toLowerCase() });
        if (!admin) throw new Error('Админа нет');
        admin.password = password;

        return this.innerRepository.save(admin);
    }

    updateName(admin: Admin, newName: string) {
        admin.name = newName;
        return admin.save();
    }

    updatePassword(admin: Admin, newPassword: string) {
        admin.password = newPassword;
        admin.temporary_code = null;
        return admin.save();
    }

    updateTemporaryCode(admin: Admin, temporaryCode: string) {
        admin.temporary_code = temporaryCode;
        return admin.save();
    }

    deleteByEmail(email: string) {
        return this.innerRepository.delete({ email: email.toLowerCase() });
    }
}
