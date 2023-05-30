import { Router } from 'express';
import { AdminsController } from '../controllers/admins.controller';
import { roleMiddleware } from '../middleware/role.middleware';
import { allAdminRoles, superAdminRoles } from '../utils/roles';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import asyncHandler from 'express-async-handler';

export const adminsRouter = () => {
    const router = Router();

    const adminsController = new AdminsController();

    router.get(
        '/',
        roleMiddleware(allAdminRoles),
        validationMiddleware,
        adminsController.getAll.bind(adminsController)
    );

    router.post(
        '/login',
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        validationMiddleware,
        adminsController.login.bind(adminsController)
    );

    router.post(
        '/insert',
        roleMiddleware(superAdminRoles),
        body('email').isEmail(),
        body('name').optional().isString(),
        body('password').optional().isString(),
        validationMiddleware,
        adminsController.insert.bind(adminsController)
    );

    router.post(
        '/demo',
        asyncHandler(authMiddleware),
        adminsController.insertDemo.bind(adminsController)
    );

    router.post(
        '/logout',
        adminsController.logout.bind(adminsController)
    );

    router.post(
        '/delete',
        roleMiddleware(superAdminRoles),
        body('email').isEmail(),
        validationMiddleware,
        adminsController.delete.bind(adminsController)
    );

    router.post(
        '/sendMail',
        body('email').isEmail(),
        validationMiddleware,
        adminsController.sendPasswordWithTemporaryPassword.bind(adminsController)
    );

    router.post(
        '/checkTemporaryPassword',
        body('email').isEmail(),
        body('code').isString().notEmpty(),
        validationMiddleware,
        adminsController.confirmTemporaryPassword.bind(adminsController)
    );

    router.patch(
        '/changePasswordByCode',
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        body('code').isString().notEmpty(),
        validationMiddleware,
        adminsController.changePasswordByCode.bind(adminsController)
    );

    router.patch(
        '/changePassword',
        roleMiddleware(allAdminRoles),
        body('email').isEmail(),
        body('password').isString().notEmpty(),
        body('oldPassword').isString().notEmpty(),
        validationMiddleware,
        adminsController.changePasswordByOldPassword.bind(adminsController)
    );

    router.patch(
        '/changeName',
        roleMiddleware(allAdminRoles),
        body('newName').isString(),
        validationMiddleware,
        adminsController.changeName.bind(adminsController)
    );

    return router;
};
