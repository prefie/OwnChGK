import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { secret } from '../utils/jwtToken';
import { MiddlewareRequestInterface } from '../entities/middleware/middleware.interfaces';

export function authMiddleware(req: MiddlewareRequestInterface, res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') {
        next();
    }

    try {
        const token = req.cookies['authorization'];
        if (!token) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }

        req.user = jwt.verify(token, secret);
        next();
    } catch (exception) {
        return res.status(403).json({ message: 'Пользователь не авторизован' });
    }
}