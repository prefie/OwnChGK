import { Request, Response, Router } from 'express';
import { resolve } from 'path';

export const mainRouter = () => {
    const router = Router();

    router.get('/*', (_req: Request, res: Response) => {
        res.sendFile(resolve('./build/frontend/index.html'));
    });

    return router;
};
