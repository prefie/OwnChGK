import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { secret, TokenPayload } from '../utils/jwtToken';

export function roleMiddleware(roles: Set<string>) {
    return function (req: Request, res: Response, next: NextFunction) {
        if (req.method === 'OPTIONS') {
            next();
        }

        try {
            const token = req.cookies['authorization'];
            if (!token) {
                return res.status(401).json({ message: 'Пользователь не авторизован' });
            }

            const { role: userRole } = jwt.verify(token, secret) as TokenPayload;
            if (!roles.has(userRole)) {
                return res.status(403).json({ message: 'У пользователя нет прав' });
            }

            next();
        } catch (exception) {
            return res.status(403).json({ message: 'Пользователь не авторизован' });
        }
    };
}