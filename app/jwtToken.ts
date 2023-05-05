import jwt, { JwtPayload } from 'jsonwebtoken';
import { AppConfig } from './app-config';

export const secret = AppConfig.jwtSecretKey ?? 'SECRET_KEY';

export interface TokenPayload extends JwtPayload {
    id?: string | undefined;
    email?: string | undefined;
    roles?: string | undefined;
    teamId?: string | undefined;
    gameId?: string | undefined;
    name?: string | undefined;
}

export const generateAccessToken = (id: string, email: string, roles: string, teamId: string, gameId: string, name?: string) => {
    const payload: TokenPayload = {
        id,
        email: email.toLowerCase(),
        roles,
        teamId,
        gameId,
        name
    };

    return jwt.sign(payload, secret, { expiresIn: '24h' });
};