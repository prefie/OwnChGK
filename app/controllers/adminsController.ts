import { compare, hash } from 'bcrypt';
import { Request, Response } from 'express';
import { generateAccessToken, getTokenFromRequest } from '../utils/jwtToken';
import {
    makeTemporaryPassword,
    SendMailWithTemporaryPassword,
    SendMailWithTemporaryPasswordToAdmin,
} from '../utils/email';
import { transporter } from '../utils/email';
import { AdminDto } from '../dtos/adminDto';
import { AdminRepository } from '../db/repositories/adminRepository';
import { demoAdminRoles } from '../utils/roles';
import { UserRepository } from '../db/repositories/userRepository';
import { AdminRoles } from '../db/entities/Admin';

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
        } catch (error) {
            return res.status(500).json({
                message: error.message,
                error,
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
                const token = generateAccessToken(admin.id, admin.email, admin.role, null, null, admin.name);
                res.cookie('authorization', token, {
                    maxAge: 24 * 60 * 60 * 1000,
                    secure: true
                });

                return res.status(200).json(new AdminDto(admin));
            } else {
                return res.status(403).json({ message: 'Not your password' });
            }
        } catch (error) {
            return res.status(500).json({
                message: error.message,
                error,
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
                error,
            });
        }
    }

    public async insertDemo(req: Request, res: Response) {
        try {
            const { email } = getTokenFromRequest(req);
            let admin = await this.adminRepository.findByEmail(email);
            if (!admin) {
                const user = await this.userRepository.findByEmail(email);
                admin = await this.adminRepository.insertByEmailAndPassword(user.email, user.password, user.name, AdminRoles.DEMOADMIN);
            }

            const token = generateAccessToken(admin.id, admin.email, admin.role, null, null, admin.name);
            res.cookie('authorization', token, {
                maxAge: 24 * 60 * 60 * 1000,
                secure: true
            });

            return res.status(200).json(new AdminDto(admin));
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async sendPasswordWithTemporaryPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;

            let admin = await this.adminRepository.findByEmail(email);
            if (admin) {
                const code = makeTemporaryPassword(8);
                await SendMailWithTemporaryPassword(transporter, email, code);
                admin.temporary_code = code;
                await admin.save();
                return res.status(200).json({});
            } else {
                return res.status(404).json({ message: 'admin not found' });
            }
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
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

            if (admin.temporary_code === code) {
                return res.status(200).json({});
            } else {
                return res.status(403).json({ message: 'not your password' });
            }
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async changeName(req: Request, res: Response) {
        try {
            const { newName } = req.body;

            const payload = getTokenFromRequest(req);
            if (payload.id) {
                const admin = await this.adminRepository.findById(payload.id);
                if (admin) {
                    admin.name = newName;
                    await admin.save();
                    const newToken = generateAccessToken(payload.id, payload.email, payload.role, payload.teamId, payload.gameId, newName);
                    res.cookie('authorization', newToken, {
                        maxAge: 24 * 60 * 60 * 1000,
                        secure: true
                    });
                    return res.status(200).json({});
                } else {
                    return res.status(404).json({ message: 'admin not found' });
                }
            }
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
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
                    admin.password = hashedPassword;
                    await admin.save();
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
                error,
            });
        }
    }

    public async changePasswordByCode(req: Request, res: Response) {
        try {
            const { email, password, code } = req.body;

            const hashedPassword = await hash(password, 10);
            let admin = await this.adminRepository.findByEmail(email);
            if (admin) {
                if (admin.temporary_code === code) {
                    admin.password = hashedPassword;
                    admin.temporary_code = null;
                    await admin.save();
                } else {
                    return res.status(403).json({ message: 'code is invalid' });
                }
            } else {
                return res.status(404).json({ message: 'admin not found' });
            }
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async logout(req: Request, res: Response) {
        try {
            res.clearCookie('authorization');

            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
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
                error,
            });
        }
    }
}
