import jwt, { JwtPayload } from 'jsonwebtoken';
import { AppConfig } from './app-config';
import { Request, Response } from 'express';

const secret = AppConfig.jwtSecretKey ?? 'SECRET_KEY';

export interface TokenPayload extends JwtPayload {
    id: string;
    email: string;
    role: string;
    teamId: string | undefined | null;
    name: string | undefined | null;
}

export const generateAccessToken = (
    id: string,
    email: string,
    role: string,
    teamId: string | undefined | null,
    name: string | undefined | null = undefined
) => {
    const payload: TokenPayload = {
        id,
        email: email.toLowerCase(),
        role,
        teamId,
        name
    };

    return jwt.sign(payload, secret, { expiresIn: '24h' });
};

export const getTokenFromString = (token: string): TokenPayload => jwt.verify(token, secret) as TokenPayload

export const getTokenFromRequest = (req: Request): TokenPayload => {
    const cookie = req.cookies['authorization'];
    return jwt.verify(cookie, secret) as TokenPayload;
}

export const setTokenInResponse = (res: Response, token: string): void => {
    res.cookie('authorization', token, {
        maxAge: 24 * 60 * 60 * 1000,
        secure: true
    });
}