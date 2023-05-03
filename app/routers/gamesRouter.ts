import {Router} from 'express';
import {roleMiddleware} from '../middleware/roleMiddleware';
import {middleware} from '../middleware/middleware';
import {GamesController} from '../controllers/gamesController';
import {adminAccess} from "./mainRouter";
import {body, param, query} from 'express-validator';
import {GameStatus} from "../db/entities/Game";
import {validateGameStatus} from "../validators";

export const gamesRouter = () => {
    const router = Router();

    const gamesController = new GamesController();

    router.get('/',
        middleware,
        query('amIParticipate').optional().isBoolean(), gamesController.getAll.bind(gamesController));

    router.get('/:gameId',
        middleware,
        param('gameId').isUUID(), gamesController.getGame.bind(gamesController));

    router.get('/:gameId/start',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(), gamesController.startGame.bind(gamesController));

    router.get('/:gameId/participants',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(), gamesController.getParticipants.bind(gamesController));

    router.patch('/:gameId/change',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        body('newGameName').isString().notEmpty(),
        body('chgkSettings.roundCount').optional().isInt({min: 0}),
        body('chgkSettings.questionCount').optional().isInt({min: 0}),
        body('matrixSettings.roundCount').optional().isInt({min: 0}),
        body('matrixSettings.questionCount').optional().isInt({min: 0}),
        body('matrixSettings.roundNames').optional().isArray(), gamesController.changeGame.bind(gamesController))

    router.patch('/:gameId/changeStatus',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        body('status').custom(validateGameStatus), gamesController.changeGameStatus.bind(gamesController));

    router.patch('/:gameId/changeIntrigueStatus',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        body('isIntrigue').isBoolean(), gamesController.changeIntrigueStatus.bind(gamesController));

    router.patch('/:gameId/changeName',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        body('newGameName').isString().notEmpty(), gamesController.editGameName.bind(gamesController));

    router.patch('/:gameId/changeAdmin',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        body('adminEmail').isEmail(), gamesController.editGameAdmin.bind(gamesController)); // Не используется

    router.delete('/:gameId',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(), gamesController.deleteGame.bind(gamesController));

    router.get('/:gameId/result',
        middleware,
        param('gameId').isUUID(), gamesController.getGameResult.bind(gamesController));

    router.get('/:gameId/resultTable',
        middleware,
        param('gameId').isUUID(), gamesController.getGameResultScoreTable.bind(gamesController));

    router.get('/:gameId/resultTable/format',
        middleware,
        param('gameId').isUUID(), gamesController.getResultWithFormat.bind(gamesController));

    router.post('/',
        roleMiddleware(adminAccess),
        body('gameName').isString().notEmpty(),
        body('teams').isArray(),
        body('chgkSettings.roundCount').optional().isInt({min: 0}),
        body('chgkSettings.questionCount').optional().isInt({min: 0}),
        body('matrixSettings.roundCount').optional().isInt({min: 0}),
        body('matrixSettings.questionCount').optional().isInt({min: 0}),
        body('matrixSettings.roundNames').optional().isArray(), gamesController.insertGame.bind(gamesController));

    return router;
}