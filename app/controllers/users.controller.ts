import { compare, hash } from 'bcrypt';
import { UserRepository } from '../db/repositories/user.repository';
import { Request, Response } from 'express';
import { generateAccessToken, getTokenFromRequest, setTokenInResponse } from '../utils/jwt-token';
import { makeTemporaryPassword, SendMailWithTemporaryPassword } from '../utils/email';
import { transporter } from '../utils/email';
import { UserDto } from '../dtos/user.dto';
import { TeamDto } from '../dtos/team.dto';
import { AdminDto } from '../dtos/admin.dto';
import { AdminRepository } from '../db/repositories/admin.repository';
import { allAdminRoles, demoAdminRoles, userRoles } from '../utils/roles';
import { User } from '../db/entities/user';

export class UsersController {
    private readonly userRepository: UserRepository;
    private readonly adminRepository: AdminRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.adminRepository = new AdminRepository();
    }

    public async getAll(req: Request, res: Response) {
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
    }

    public async login(req: Request, res: Response) {
        const { email, password } = req.body;

        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'user not found' });
        }

        const isPasswordMatching = await compare(password, user.password);
        if (isPasswordMatching) {
            const token = generateAccessToken(user.id, user.email, 'user', user.team?.id, user.name);
            setTokenInResponse(res, token);
            return res.status(200).json(new UserDto(user));
        } else {
            return res.status(400).json({ message: 'Not your password' });
        }
    }

    public async insert(req: Request, res: Response) {
        const { email, password } = req.body;

        const user = await this.userRepository.findByEmail(email);
        if (user) {
            return res.status(409).json({ message: 'The user with this email is already registered' });
        }

        const hashedPassword = await hash(password, 10);
        const userFromDb = await this.userRepository.insertByEmailAndPassword(email, hashedPassword);

        const token = generateAccessToken(userFromDb.id, email, 'user', null, null);
        setTokenInResponse(res, token);

        return res.status(200).json({});
    }

    public async insertDemo(req: Request, res: Response) {
        const { email } = getTokenFromRequest(req);
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'Юзера с таким e-mail нет' });
        }

        const token = generateAccessToken(user.id, user.email, 'user', user.team?.id, user.name);
        setTokenInResponse(res, token);

        return res.status(200).json(new UserDto(user));
    }

    public async changeName(req: Request, res: Response) {
        const { newName } = req.body;

        const payload = getTokenFromRequest(req);
        if (payload.id) {
            const user = await this.userRepository.findById(payload.id);
            if (user) {
                user.name = newName;
                await user.save();
                const newToken = generateAccessToken(payload.id, payload.email, payload.role, payload.teamId, newName);
                setTokenInResponse(res, newToken);
                return res.status(200).json({});
            } else {
                return res.status(404).json({});
            }
        }
    }

    public async changePasswordByOldPassword(req: Request, res: Response) {
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
    }

    public async changePasswordByCode(req: Request, res: Response) {
        const { email, password, code } = req.body;

        const hashedPassword = await hash(password, 10);
        let user = await this.userRepository.findByEmail(email);
        if (user) {
            if (user.temporary_code == code) {
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
    }

    public async sendPasswordWithTemporaryPassword(req: Request, res: Response) {
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
    }

    public async confirmTemporaryPassword(req: Request, res: Response) {
        const { email, code } = req.body;
        let user = await this.userRepository.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'user not found' });
        }

        if (user.temporary_code == code) {
            return res.status(200).json({});
        } else {
            return res.status(403).json({ message: 'code is invalid' });
        }
    }

    public async getTeam(req: Request, res: Response) {
        const { id: userId, teamId } = getTokenFromRequest(req);
        const user = await this.userRepository.findById(userId);

        if (teamId != user.team?.id) {
            const token = generateAccessToken(user.id, user.email, 'user', user.team?.id, user.name);
            setTokenInResponse(res, token);
        }

        if (user.team !== null) {
            return res.status(200).json(new TeamDto(user.team));
        } else {
            return res.status(200).json({});
        }
    }

    public async get(req: Request, res: Response) {
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
    }

    public async logout(req: Request, res: Response) {
        res.clearCookie('authorization');
        return res.status(200).json({});
    }
}
