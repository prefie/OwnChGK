import { Router } from 'express';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import { GamesController } from '../controllers/gamesController';
import { adminAccess } from './mainRouter';
import { body, param, query } from 'express-validator';
import { validateGameStatus } from '../validators';
import { validationMiddleware } from '../middleware/validationMiddleware';

export const gamesRouter = () => {
    const router = Router();

    const gamesController = new GamesController();

    router.get(
        '/',
        authMiddleware,
        query('amIParticipate').optional().isBoolean(),
        validationMiddleware,
        gamesController.getAll.bind(gamesController));

    router.get(
        '/:gameId',
        authMiddleware,
        param('gameId').isUUID(),
        validationMiddleware,
        gamesController.getGame.bind(gamesController));

    router.get(
        '/:gameId/start',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        validationMiddleware,
        gamesController.startGame.bind(gamesController));

    router.get(
        '/:gameId/participants',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        validationMiddleware,
        gamesController.getParticipants.bind(gamesController));

    router.patch(
        '/:gameId/change',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        body('newGameName').isString().notEmpty(),
        body('chgkSettings.roundCount').optional().isInt({ min: 0 }),
        body('chgkSettings.questionCount').optional().isInt({ min: 0 }),
        body('matrixSettings.roundCount').optional().isInt({ min: 0 }),
        body('matrixSettings.questionCount').optional().isInt({ min: 0 }),
        body('matrixSettings.roundNames').optional().isArray(),
        validationMiddleware,
        gamesController.changeGame.bind(gamesController));

    router.patch(
        '/:gameId/changeStatus',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        body('status').custom(validateGameStatus),
        validationMiddleware,
        gamesController.changeGameStatus.bind(gamesController));

    router.patch(
        '/:gameId/changeIntrigueStatus',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        body('isIntrigue').isBoolean(),
        validationMiddleware,
        gamesController.changeIntrigueStatus.bind(gamesController));

    router.patch(
        '/:gameId/changeName',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        body('newGameName').isString().notEmpty(),
        validationMiddleware,
        gamesController.editGameName.bind(gamesController));

    router.patch(
        '/:gameId/changeAdmin',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        body('adminEmail').isEmail(),
        validationMiddleware,
        gamesController.editGameAdmin.bind(gamesController)); // Не используется

    router.delete(
        '/:gameId',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        validationMiddleware,
        gamesController.deleteGame.bind(gamesController));

    router.get(
        '/:gameId/result',
        authMiddleware,
        param('gameId').isUUID(),
        validationMiddleware,
        gamesController.getGameResult.bind(gamesController));

    router.get(
        '/:gameId/resultTable',
        authMiddleware,
        param('gameId').isUUID(),
        validationMiddleware,
        gamesController.getGameResultScoreTable.bind(gamesController));

    router.get(
        '/:gameId/resultTable/format',
        authMiddleware,
        param('gameId').isUUID(),
        validationMiddleware,
        gamesController.getResultWithFormat.bind(gamesController));

    router.post(
        '/',
        roleMiddleware(adminAccess),
        body('gameName').isString().notEmpty(),
        body('teams').isArray(),
        body('chgkSettings.roundCount').optional().isInt({ min: 0 }),
        body('chgkSettings.questionCount').optional().isInt({ min: 0 }),
        body('matrixSettings.roundCount').optional().isInt({ min: 0 }),
        body('matrixSettings.questionCount').optional().isInt({ min: 0 }),
        body('matrixSettings.roundNames').optional().isArray(),
        validationMiddleware,
        gamesController.insertGame.bind(gamesController));

    return router;
};