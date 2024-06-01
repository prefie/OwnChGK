import { Response, NextFunction } from 'express';
import { getTokenFromString } from '../utils/jwt-token';
import { MiddlewareRequestInterface } from '../entities/middleware/middleware.interface';

export function authMiddleware(req: MiddlewareRequestInterface, res: Response, next: NextFunction) {
    if (req.method == 'OPTIONS') {
        next();
    }

    try {
        const token = req.cookies['authorization'];
        if (!token) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }

        req.user = getTokenFromString(token);
        next();
    } catch (exception) {
        return res.status(403).json({ message: 'Пользователь не авторизован' });
    }
}
