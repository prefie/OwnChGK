import { Router } from 'express';
import { TeamsController } from '../controllers/teams.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { allAdminRoles } from '../utils/roles';
import { body, param, query } from 'express-validator';
import { validationMiddleware } from '../middleware/validation.middleware';
import asyncHandler from 'express-async-handler';

export const teamsRouter = () => {
    const router = Router();

    const teamsController = new TeamsController();

    router.get(
        '/',
        asyncHandler(authMiddleware),
        query('withoutUser').optional().isBoolean(),
        validationMiddleware,
        teamsController.getAll.bind(teamsController)
    );

    router.get(
        '/:teamId',
        asyncHandler(authMiddleware),
        param('teamId').isUUID(),
        validationMiddleware,
        teamsController.getTeam.bind(teamsController)
    );

    router.get(
        '/:teamId/participants',
        asyncHandler(authMiddleware),
        param('teamId').isUUID(),
        validationMiddleware,
        teamsController.getParticipants.bind(teamsController)
    );

    router.patch(
        '/:teamId/change',
        asyncHandler(authMiddleware),
        param('teamId').isUUID(),
        body('newTeamName').isString().notEmpty(),
        body('captain').optional({ nullable: true }).isEmail(),
        body('participants').optional({ nullable: true }).isArray(),
        body('participants.*.email').optional().isString(), // TODO: потом добавить валидацию на мыло
        body('participants.*.name').optional().isString(),
        validationMiddleware,
        teamsController.editTeam.bind(teamsController)
    );

    router.patch(
        '/:teamId/changeCaptain',
        asyncHandler(authMiddleware),
        param('teamId').isUUID(),
        validationMiddleware,
        teamsController.editTeamCaptainByCurrentUser.bind(teamsController)
    );

    router.delete(
        '/:teamId',
        roleMiddleware(allAdminRoles),
        param('teamId').isUUID(),
        validationMiddleware,
        teamsController.deleteTeam.bind(teamsController)
    );

    router.post(
        '/',
        asyncHandler(authMiddleware),
        body('teamName').isString().notEmpty(),
        body('captain').optional({ nullable: true }).isEmail(),
        body('participants').optional({ nullable: true }).isArray(),
        body('participants.*.email').optional().isString(), // TODO: потом добавить валидацию на мыло
        body('participants.*.name').optional().isString(),
        validationMiddleware,
        teamsController.insertTeam.bind(teamsController)
    );

    return router;
};
