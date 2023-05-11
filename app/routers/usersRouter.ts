import { Router } from 'express';
import { UsersController } from '../controllers/usersController';
import { authMiddleware } from '../middleware/authMiddleware';
import { body, query } from 'express-validator';

export const usersRouter = () => {
    const router = Router();

    const usersController = new UsersController();

    router.get(
        '/',
        authMiddleware,
        query('withoutTeam').optional().isBoolean(),
        usersController.getAll.bind(usersController)
    );

    router.get(
        '/current',
        usersController.get.bind(usersController)
    );

    router.post(
        '/login',
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        usersController.login.bind(usersController)
    );

    router.post(
        '/insert',
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        usersController.insert.bind(usersController)
    );

    router.post(
        '/demo',
        authMiddleware,
        usersController.insertDemo.bind(usersController)
    );

    router.post(
        '/logout',
        usersController.logout.bind(usersController)
    );

    router.post(
        '/sendMail',
        body('email').isEmail(),
        usersController.sendPasswordWithTemporaryPassword.bind(usersController)
    );

    router.post(
        '/checkTemporaryPassword',
        body('email').isEmail(),
        body('code').isString().notEmpty(),
        usersController.confirmTemporaryPassword.bind(usersController)
    );

    router.get(
        '/getTeam',
        authMiddleware,
        usersController.getTeam.bind(usersController)
    );

    router.patch(
        '/changePasswordByCode',
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        body('code').isString().notEmpty(),
        usersController.changePasswordByCode.bind(usersController)
    );

    router.patch(
        '/changeName',
        authMiddleware,
        body('newName').isString(),
        usersController.changeName.bind(usersController)
    );

    router.patch(
        '/changePassword',
        authMiddleware,
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        body('oldPassword').isString().notEmpty(),
        usersController.changePasswordByOldPassword.bind(usersController)
    );

    return router;
};
