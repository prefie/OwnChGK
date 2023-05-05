import { Router } from 'express';
import { AdminsController } from '../controllers/adminsController';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { adminAccess, superAdminAccess } from './mainRouter';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

export const adminsRouter = () => {
    const router = Router();

    const adminsController = new AdminsController();

    router.get(
        '/',
        roleMiddleware(adminAccess),
        validationMiddleware,
        adminsController.getAll.bind(adminsController));

    router.post(
        '/login',
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        validationMiddleware,
        adminsController.login.bind(adminsController));

    router.post(
        '/insert',
        roleMiddleware(superAdminAccess),
        body('email').isEmail(),
        body('name').optional().isString(),
        body('password').optional().isString(),
        validationMiddleware,
        adminsController.insert.bind(adminsController));

    router.post(
        '/logout',
        adminsController.logout.bind(adminsController));

    router.post(
        '/delete',
        roleMiddleware(superAdminAccess),
        body('email').isEmail(),
        validationMiddleware,
        adminsController.delete.bind(adminsController));

    router.post(
        '/sendMail',
        body('email').isEmail(),
        validationMiddleware,
        adminsController.sendPasswordWithTemporaryPassword.bind(adminsController));

    router.post(
        '/checkTemporaryPassword',
        body('email').isEmail(),
        body('code').isString().notEmpty(),
        validationMiddleware,
        adminsController.confirmTemporaryPassword.bind(adminsController));

    router.patch(
        '/changePasswordByCode',
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        body('code').isString().notEmpty(),
        validationMiddleware,
        adminsController.changePasswordByCode.bind(adminsController));

    router.patch(
        '/changePassword',
        roleMiddleware(adminAccess),
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        body('oldPassword').isString().notEmpty(),
        validationMiddleware,
        adminsController.changePasswordByOldPassword.bind(adminsController));

    router.patch(
        '/changeName',
        roleMiddleware(adminAccess),
        body('newName').isString(),
        validationMiddleware,
        adminsController.changeName.bind(adminsController));

    return router;
};
