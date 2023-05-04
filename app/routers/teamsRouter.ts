import { Router } from 'express';
import { TeamsController } from '../controllers/teamsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { adminAccess } from './mainRouter';
import { body, param, query } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

export const teamsRouter = () => {
    const router = Router();

    const teamsController = new TeamsController();

    router.get(
        '/',
        authMiddleware,
        query('withoutUser').optional().isBoolean(),
        validationMiddleware,
        teamsController.getAll.bind(teamsController));

    router.get(
        '/:teamId',
        authMiddleware,
        param('teamId').isUUID(),
        validationMiddleware,
        teamsController.getTeam.bind(teamsController));

    router.get(
        '/:teamId/participants',
        authMiddleware,
        param('teamId').isUUID(),
        validationMiddleware,
        teamsController.getParticipants.bind(teamsController));

    router.patch(
        '/:teamId/change',
        authMiddleware,
        param('teamId').isUUID(),
        body('newTeamName').isString().notEmpty(),
        body('captain').optional({ nullable: true }).isEmail(),
        body('participants').optional({ nullable: true }).isArray(),
        body('participants.*.email').optional().isString(), // TODO: потом добавить валидацию на мыло
        body('participants.*.name').optional().isString(),
        validationMiddleware,
        teamsController.editTeam.bind(teamsController)); // TODO: внутри есть проверка юзера, мб перенести в новый middleware

    router.patch(
        '/:teamId/changeCaptain',
        authMiddleware,
        param('teamId').isUUID(),
        validationMiddleware,
        teamsController.editTeamCaptainByCurrentUser.bind(teamsController));

    router.delete(
        '/:teamId',
        roleMiddleware(adminAccess),
        param('teamId').isUUID(),
        validationMiddleware,
        teamsController.deleteTeam.bind(teamsController));

    router.patch(
        '/:teamId/deleteCaptain',
        authMiddleware,
        param('teamId').isUUID(),
        validationMiddleware,
        teamsController.deleteTeamCaptainById.bind(teamsController));

    router.post(
        '/',
        authMiddleware,
        body('teamName').isString().notEmpty(),
        body('captain').optional({ nullable: true }).isEmail(),
        body('participants').optional({ nullable: true }).isArray(),
        body('participants.*.email').optional().isString(), // TODO: потом добавить валидацию на мыло
        body('participants.*.name').optional().isString(),
        validationMiddleware,
        teamsController.insertTeam.bind(teamsController));

    return router;
};
