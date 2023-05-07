import { compare, hash } from 'bcrypt';
import { UserRepository } from '../db/repositories/userRepository';
import { Request, Response } from 'express';
import { generateAccessToken, getTokenFromRequest } from '../utils/jwtToken';
import { makeTemporaryPassword, SendMailWithTemporaryPassword } from '../utils/email';
import { transporter } from '../utils/email';
import { UserDto } from '../dtos/userDto';
import { TeamDto } from '../dtos/teamDto';
import { AdminDto } from '../dtos/adminDto';
import { AdminRepository } from '../db/repositories/adminRepository';
import { allAdminRoles, demoAdminRoles, userRoles } from '../utils/roles';
import { User } from '../db/entities/User';

export class UsersController { // TODO: дописать смену имени пользователя, удаление
    private readonly userRepository: UserRepository;
    private readonly adminRepository: AdminRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.adminRepository = new AdminRepository();
    }

    public async getAll(req: Request, res: Response) {
        try {
            const { withoutTeam } = req.query;

            const { email, role } = getTokenFromRequest(req);
            let users: User[];
            if (demoAdminRoles.has(role)) {
                const user = await this.userRepository.findByEmail(email);
                users = withoutTeam && user.team ? [] : [user];
            } else {
                users = withoutTeam
                    ? await this.userRepository.findUsersWithoutTeam()
                    : await this.userRepository.find();
            }

            return res.status(200).json({
                users: users?.map(user => new UserDto(user))
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

            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                return res.status(404).json({ message: 'user not found' });
            }

            const isPasswordMatching = await compare(password, user.password);
            if (isPasswordMatching) {
                const token = generateAccessToken(user.id, user.email, 'user', user.team?.id, null, user.name);
                res.cookie('authorization', token, {
                    maxAge: 86400 * 1000,
                    secure: true
                });
                return res.status(200).json(new UserDto(user));
            } else {
                return res.status(400).json({ message: 'Not your password' });
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
            const { email, password } = req.body;

            const user = await this.userRepository.findByEmail(email);
            if (user) {
                return res.status(409).json({ message: 'The user with this email is already registered' });
            }

            const hashedPassword = await hash(password, 10);
            const userFromDb = await this.userRepository.insertByEmailAndPassword(email, hashedPassword);
            const userId = userFromDb.id;
            const token = generateAccessToken(userId, email, 'user', null, null);
            res.cookie('authorization', token, {
                maxAge: 24 * 60 * 60 * 1000,
                secure: true
            });

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
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                return res.status(404).json({ message: 'Юзера с таким e-mail нет' });
            }

            const token = generateAccessToken(user.id, user.email, 'user', user.team?.id, null, user.name);
            res.cookie('authorization', token, {
                maxAge: 86400 * 1000,
                secure: true
            });

            return res.status(200).json(new UserDto(user));
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    // вызывается только если знаем, что у юзера текущего точно есть команда
    public async changeTokenWhenGoIntoGame(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            const {
                id: userId,
                email: email,
                role: userRole,
                name: name
            } = getTokenFromRequest(req);

            if (userRoles.has(userRole)) {
                const user = await this.userRepository.findById(userId);

                if (user?.team !== null) {
                    const token = generateAccessToken(userId, email, userRole, user.team.id, gameId, name);
                    res.cookie('authorization', token, {
                        maxAge: 24 * 60 * 60 * 1000,
                        secure: true
                    });
                    return res.status(200).json({});
                }
            } else if (allAdminRoles.has(userRole)) {
                const token = generateAccessToken(userId, email, userRole, null, gameId, name);
                res.cookie('authorization', token, {
                    maxAge: 24 * 60 * 60 * 1000,
                    secure: true
                });
                return res.status(200).json({});
            } else {
                return res.status(400).json({});
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
                const user = await this.userRepository.findById(payload.id);
                if (user) {
                    user.name = newName;
                    await user.save();
                    const newToken = generateAccessToken(payload.id, payload.email, payload.role, payload.teamId, payload.gameId, newName);
                    res.cookie('authorization', newToken, {
                        maxAge: 24 * 60 * 60 * 1000,
                        secure: true
                    });
                    return res.status(200).json({});
                } else {
                    return res.status(404).json({});
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
            let user = await this.userRepository.findByEmail(email);
            if (user) {
                if (await compare(oldPassword, user.password)) {
                    user.password = hashedPassword;
                    await user.save();
                    return res.status(200).json({});
                } else {
                    return res.status(403).json({ message: 'oldPassword is invalid' });
                }
            } else {
                return res.status(404).json({ message: 'user not found' });
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
            let user = await this.userRepository.findByEmail(email);
            if (user) {
                if (user.temporary_code === code) {
                    user.password = hashedPassword;
                    user.temporary_code = null;
                    await user.save();
                    return res.status(200).json({});
                } else {
                    return res.status(403).json({ message: 'code invalid' });
                }
            } else {
                return res.status(404).json({ message: 'user not found' });
            }
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

            let user = await this.userRepository.findByEmail(email);
            if (user) {
                const code = makeTemporaryPassword(8);
                await SendMailWithTemporaryPassword(transporter, email, code);
                user.temporary_code = code;
                await user.save();
                return res.status(200).json({});
            } else {
                return res.status(404).json({ message: 'user not found' });
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
            let user = await this.userRepository.findByEmail(email);
            if (!user) {
                return res.status(404).json({ message: 'user not found' });
            }

            if (user.temporary_code === code) {
                return res.status(200).json({});
            } else {
                return res.status(403).json({ message: 'code is invalid' });
            }
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async getTeam(req: Request, res: Response) {
        try {
            const { id: userId } = getTokenFromRequest(req);
            const user = await this.userRepository.findById(userId);

            if (user.team !== null) {
                return res.status(200).json(new TeamDto(user.team));
            } else {
                return res.status(200).json({});
            }
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async get(req: Request, res: Response) {
        try {
            const {
                id,
                role,
            } = getTokenFromRequest(req);

            if (id !== undefined) {
                if (userRoles.has(role)) {
                    const user = await this.userRepository.findById(id);
                    return res.status(200).json(new UserDto(user));
                } else if (allAdminRoles.has(role)) {
                    const admin = await this.adminRepository.findById(id);
                    return res.status(200).json(new AdminDto(admin));
                } else {
                    return res.status(400).json({});
                }
            } else {
                return res.status(404).json({ message: 'user/admin not found' });
            }
        } catch (error: any) {
            if (error.message === 'jwt must be provided') { // TODO: убрать)
                return res.status(401).json({});
            }

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
}
