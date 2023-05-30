import { compare, hash } from 'bcrypt';
import { Request, Response } from 'express';
import { generateAccessToken, getTokenFromRequest, setTokenInResponse } from '../utils/jwt-token';
import {
    makeTemporaryPassword,
    SendMailWithTemporaryPassword,
    SendMailWithTemporaryPasswordToAdmin,
} from '../utils/email';
import { transporter } from '../utils/email';
import { AdminDto } from '../dtos/admin.dto';
import { AdminRepository } from '../db/repositories/admin.repository';
import { demoAdminRoles } from '../utils/roles';
import { UserRepository } from '../db/repositories/user.repository';
import { AdminRoles } from '../db/entities/admin';

export class AdminsController {
    private readonly adminRepository: AdminRepository;
    private readonly userRepository: UserRepository;

    constructor() {
        this.adminRepository = new AdminRepository();
        this.userRepository = new UserRepository();
    }

    public async getAll(req: Request, res: Response) {
        try {
            const { role } = getTokenFromRequest(req);
            if (demoAdminRoles.has(role)) {
                return res.status(200).json({
                    admins: [],
                });
            }

            const admins = await this.adminRepository.find();
            return res.status(200).json({
                admins: admins?.map(admin => new AdminDto(admin))
            });
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error: JSON.stringify(error?.stack),
            });
        }
    }

    public async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const admin = await this.adminRepository.findByEmail(email);
            if (!admin) {
                return res.status(404).json({ message: 'admin not found' });
            }

            const isPasswordMatching = await compare(password, admin.password);
            if (isPasswordMatching) {
                const token = generateAccessToken(admin.id, admin.email, admin.role, null, admin.name);
                setTokenInResponse(res, token);

                return res.status(200).json(new AdminDto(admin));
            } else {
                return res.status(403).json({ message: 'Not your password' });
            }
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error: JSON.stringify(error?.stack),
            });
        }
    }

    public async insert(req: Request, res: Response) {
        try {
            const { email, name, password } = req.body;
            if (password) {
                const hashedPassword = await hash(password, 10);
                await this.adminRepository.insertByEmailAndPassword(email, hashedPassword, name);
            } else {
                const pass = makeTemporaryPassword(20);
                const hashedPassword = await hash(pass, 10);
                await this.adminRepository.insertByEmailAndPassword(email, hashedPassword, name);
                await SendMailWithTemporaryPasswordToAdmin(transporter, email, pass);
            }
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error: JSON.stringify(error?.stack),
            });
        }
    }

    public async insertDemo(req: Request, res: Response) {
        try {
            const { email } = getTokenFromRequest(req);
            let admin = await this.adminRepository.findByEmail(email);
            if (!admin) {
                const user = await this.userRepository.findByEmail(email);
                if (!user) {
                    return res.status(400).json({ 'message': 'Юзера нет' });
                }

                admin = await this.adminRepository
                    .insertByEmailAndPassword(user.email, user.password, user.name, AdminRoles.DEMOADMIN);
            }

            const token = generateAccessToken(admin.id, admin.email, admin.role, null, admin.name);
            setTokenInResponse(res, token);

            return res.status(200).json(new AdminDto(admin));
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error: JSON.stringify(error?.stack),
            });
        }
    }

    public async sendPasswordWithTemporaryPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;

            let admin = await this.adminRepository.findByEmail(email);
            if (admin) {
                const code = makeTemporaryPassword(8);
                await this.adminRepository.updateTemporaryCode(admin, code);
                await SendMailWithTemporaryPassword(transporter, email, code);
                return res.status(200).json({});
            } else {
                return res.status(404).json({ message: 'admin not found' });
            }
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error: JSON.stringify(error?.stack),
            });
        }
    }

    public async confirmTemporaryPassword(req: Request, res: Response) {
        try {
            const { email, code } = req.body;
            let admin = await this.adminRepository.findByEmail(email);
            if (!admin) {
                return res.status(404).json({ message: 'admin not found' });
            }

            if (admin.temporary_code == code) {
                return res.status(200).json({});
            } else {
                return res.status(403).json({ message: 'not your password' });
            }
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error: JSON.stringify(error?.stack),
            });
        }
    }

    public async changeName(req: Request, res: Response) {
        try {
            const { newName } = req.body;

            const { id, email, role } = getTokenFromRequest(req);
            const admin = await this.adminRepository.findById(id);
            if (admin) {
                await this.adminRepository.updateName(admin, newName);
                const newToken = generateAccessToken(id, email, role, null, newName);
                setTokenInResponse(res, newToken);
                return res.status(200).json({});
            } else {
                return res.status(404).json({ message: 'admin not found' });
            }
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error: JSON.stringify(error?.stack),
            });
        }
    }

    public async changePasswordByOldPassword(req: Request, res: Response) {
        try {
            const { email, password, oldPassword } = req.body;

            const hashedPassword = await hash(password, 10);
            let admin = await this.adminRepository.findByEmail(email);
            if (admin) {
                if (await compare(oldPassword, admin.password)) {
                    await this.adminRepository.updatePassword(admin, hashedPassword);
                    return res.status(200).json({});
                } else {
                    return res.status(403).json({ message: 'oldPassword is invalid' });
                }
            } else {
                return res.status(404).json({ message: 'admin not found' });
            }
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error: JSON.stringify(error?.stack),
            });
        }
    }

    public async changePasswordByCode(req: Request, res: Response) {
        try {
            const { email, password, code } = req.body;

            const hashedPassword = await hash(password, 10);
            let admin = await this.adminRepository.findByEmail(email);
            if (admin) {
                if (admin.temporary_code == code) {
                    await this.adminRepository.updatePassword(admin, hashedPassword);
                    return res.status(200).json({});
                } else {
                    return res.status(403).json({ message: 'code is invalid' });
                }
            } else {
                return res.status(404).json({ message: 'admin not found' });
            }
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error: JSON.stringify(error?.stack),
            });
        }
    }

    public async logout(_req: Request, res: Response) {
        try {
            res.clearCookie('authorization');

            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error: JSON.stringify(error?.stack),
            });
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const { email } = req.body;
            await this.adminRepository.deleteByEmail(email);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error: JSON.stringify(error?.stack),
            });
        }
    }
}
