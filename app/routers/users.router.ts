import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { body, query } from 'express-validator';
import asyncHandler from 'express-async-handler';

export const usersRouter = () => {
    const router = Router();

    const usersController = new UsersController();

    router.get(
        '/',
        authMiddleware,
        query('withoutTeam').optional().isBoolean(),
        asyncHandler(usersController.getAll.bind(usersController)),
    );

    router.get('/current', asyncHandler(usersController.get.bind(usersController)));

    router.post(
        '/login',
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        asyncHandler(usersController.login.bind(usersController)),
    );

    router.post(
        '/insert',
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        asyncHandler(usersController.insert.bind(usersController)),
    );

    router.post('/demo', authMiddleware, asyncHandler(usersController.insertDemo.bind(usersController)));

    router.post('/logout', asyncHandler(usersController.logout.bind(usersController)));

    router.post(
        '/sendMail',
        body('email').isEmail(),
        asyncHandler(usersController.sendPasswordWithTemporaryPassword.bind(usersController)),
    );

    router.post(
        '/checkTemporaryPassword',
        body('email').isEmail(),
        body('code').isString().notEmpty(),
        asyncHandler(usersController.confirmTemporaryPassword.bind(usersController)),
    );

    router.get('/getTeam', authMiddleware, asyncHandler(usersController.getTeam.bind(usersController)));

    router.patch(
        '/changePasswordByCode',
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        body('code').isString().notEmpty(),
        asyncHandler(usersController.changePasswordByCode.bind(usersController)),
    );

    router.patch(
        '/changeName',
        authMiddleware,
        body('newName').isString(),
        asyncHandler(usersController.changeName.bind(usersController)),
    );

    router.patch(
        '/changePassword',
        authMiddleware,
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        body('oldPassword').isString().notEmpty(),
        asyncHandler(usersController.changePasswordByOldPassword.bind(usersController)),
    );

    return router;
};
