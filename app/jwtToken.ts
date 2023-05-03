import jwt from 'jsonwebtoken';
import { AppConfig } from './app-config';

export const secret = AppConfig.jwtSecretKey ?? 'SECRET_KEY';

export const generateAccessToken = (id: string, email: string, roles: string, teamId: string, gameId: string, name?: string) => {
    const payload = {
        id,
        email,
        roles,
        teamId,
        gameId,
        name
    };

    return jwt.sign(payload, secret, { expiresIn: '24h' });
};