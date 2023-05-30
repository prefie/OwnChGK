import { Request, Response, NextFunction } from 'express';
import { getTokenFromString } from '../utils/jwt-token';

export function roleMiddleware(roles: Set<string>) {
    return function (req: Request, res: Response, next: NextFunction) {
        if (req.method == 'OPTIONS') {
            next();
        }

        try {
            const token = req.cookies['authorization'];
            if (!token) {
                res.status(401).json({ message: 'Пользователь не авторизован' });
                return;
            }

            const { role: userRole } = getTokenFromString(token);
            if (!roles.has(userRole)) {
                res.status(403).json({ message: 'У пользователя нет прав' });
                return;
            }

            next();
        } catch (exception) {
            res.status(403).json({ message: 'Пользователь не авторизован' });
            return;
        }
    };
}