import { Response, NextFunction, Request } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.method == 'OPTIONS') {
        next();
    }

    try {
        const token = req.cookies['authorization'];
        if (!token) {
            res.status(401).json({ message: 'Пользователь не авторизован' });
            return;
        }

        next();
    } catch (exception) {
        res.status(403).json({ message: 'Пользователь не авторизован' });
        return;
    }
}