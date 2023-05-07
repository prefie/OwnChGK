import jwt, { JwtPayload } from 'jsonwebtoken';
import { AppConfig } from './app-config';
import { Request } from 'express';

export const secret = AppConfig.jwtSecretKey ?? 'SECRET_KEY';

export interface TokenPayload extends JwtPayload {
    id?: string | undefined;
    email?: string | undefined;
    role?: string | undefined;
    teamId?: string | undefined;
    gameId?: string | undefined;
    name?: string | undefined;
}

export const generateAccessToken = (id: string, email: string, role: string, teamId: string, gameId: string, name?: string) => {
    const payload: TokenPayload = {
        id,
        email: email.toLowerCase(),
        role,
        teamId,
        gameId,
        name
    };

    return jwt.sign(payload, secret, { expiresIn: '24h' });
};

export const getTokenFromRequest = (req: Request): TokenPayload => {
    const cookie = req.cookies['authorization'];
    return jwt.verify(cookie, secret) as TokenPayload;
}