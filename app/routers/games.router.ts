import { Router } from 'express';
import { roleMiddleware } from '../middleware/role.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { GamesController } from '../controllers/games.controller';
import { allAdminRoles } from '../utils/roles';
import { body, param, query } from 'express-validator';
import { validateAccessLevel, validateGameStatus, validateRoundTypes } from '../utils/validators';
import { validationMiddleware } from '../middleware/validation.middleware';
import asyncHandler from 'express-async-handler';

export const gamesRouter = () => {
    const router = Router();

    const gamesController = new GamesController();

    router.get(
        '/',
        authMiddleware,
        query('amIParticipate').optional().isBoolean(),
        validationMiddleware,
        asyncHandler(gamesController.getAll.bind(gamesController))
    );

    router.get(
        '/:gameId',
        authMiddleware,
        param('gameId').isUUID(),
        validationMiddleware,
        asyncHandler(gamesController.getGame.bind(gamesController))
    );

    router.get(
        '/:gameId/start',
        roleMiddleware(allAdminRoles),
        param('gameId').isUUID(),
        validationMiddleware,
        asyncHandler(gamesController.startGame.bind(gamesController))
    );

    router.post(
        '/:gameId/close',
        roleMiddleware(allAdminRoles),
        param('gameId').isUUID(),
        validationMiddleware,
        asyncHandler(gamesController.closeGame.bind(gamesController))
    );

    router.get(
        '/:gameId/participants',
        roleMiddleware(allAdminRoles),
        param('gameId').isUUID(),
        validationMiddleware,
        asyncHandler(gamesController.getParticipants.bind(gamesController))
    );

    router.post(
        '/:gameId/team',
        authMiddleware,
        param('gameId').isUUID(),
        body('teamId').optional().isUUID(),
        validationMiddleware,
        asyncHandler(gamesController.addTeamInBigGame.bind(gamesController))
    );

    router.delete(
        '/:gameId/team',
        authMiddleware,
        param('gameId').isUUID(),
        body('teamId').optional().isUUID(),
        validationMiddleware,
        asyncHandler(gamesController.deleteTeamFromBigGame.bind(gamesController))
    );

    router.patch(
        '/:gameId/change',
        roleMiddleware(allAdminRoles),
        param('gameId').isUUID(),
        body('newGameName').isString().notEmpty(),
        body('accessLevel').optional().custom(validateAccessLevel),

        body('chgkSettings.roundsCount')
            .if(body('chgkSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('chgkSettings.questionsCount')
            .if(body('chgkSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('chgkSettings.questions').optional({ nullable: true }).isObject(),

        body('matrixSettings.roundsCount')
            .if(body('matrixSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('matrixSettings.questionsCount')
            .if(body('matrixSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('matrixSettings.roundNames')
            .if(body('matrixSettings').exists({ checkNull: true }))
            .isArray({ min: 0, max: 30 }),
        body('matrixSettings.questions').optional({ nullable: true }).isObject(),

        body('quizSettings.roundsCount')
            .if(body('quizSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('quizSettings.questionsCount')
            .if(body('quizSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('quizSettings.roundNames')
            .if(body('quizSettings').exists({ checkNull: true }))
            .isArray({ min: 0, max: 30 }),
        body('quizSettings.roundTypes')
            .if(body('quizSettings').exists({ checkNull: true }))
            .isArray({ min: 0, max: 30 })
            .custom(validateRoundTypes),
        body('quizSettings.questions').optional({ nullable: true }).isObject(),

        validationMiddleware,
        asyncHandler(gamesController.changeGame.bind(gamesController))
    );

    router.patch(
        '/:gameId/changeStatus',
        roleMiddleware(allAdminRoles),
        param('gameId').isUUID(),
        body('status').custom(validateGameStatus),
        validationMiddleware,
        asyncHandler(gamesController.changeGameStatus.bind(gamesController))
    );

    router.patch(
        '/:gameId/changeIntrigueStatus',
        roleMiddleware(allAdminRoles),
        param('gameId').isUUID(),
        body('isIntrigue').isBoolean(),
        validationMiddleware,
        asyncHandler(gamesController.changeIntrigueStatus.bind(gamesController))
    );

    router.patch(
        '/:gameId/changeName',
        roleMiddleware(allAdminRoles),
        param('gameId').isUUID(),
        body('newGameName').isString().notEmpty(),
        validationMiddleware,
        asyncHandler(gamesController.editGameName.bind(gamesController))
    );

    router.patch(
        '/:gameId/changeAdmin',
        roleMiddleware(allAdminRoles),
        param('gameId').isUUID(),
        body('adminEmail').isEmail(),
        validationMiddleware,
        asyncHandler(gamesController.editGameAdmin.bind(gamesController))
    ); // Не используется

    router.delete(
        '/:gameId',
        roleMiddleware(allAdminRoles),
        param('gameId').isUUID(),
        validationMiddleware,
        asyncHandler(gamesController.deleteGame.bind(gamesController))
    );

    router.get(
        '/:gameId/result',
        authMiddleware,
        param('gameId').isUUID(),
        validationMiddleware,
        asyncHandler(gamesController.getGameResult.bind(gamesController))
    );

    router.get(
        '/:gameId/resultTable',
        authMiddleware,
        param('gameId').isUUID(),
        validationMiddleware,
        asyncHandler(gamesController.getGameResultScoreTable.bind(gamesController))
    );

    router.get(
        '/:gameId/resultTable/format',
        authMiddleware,
        param('gameId').isUUID(),
        validationMiddleware,
        asyncHandler(gamesController.getResultWithFormat.bind(gamesController))
    );

    router.post(
        '/',
        roleMiddleware(allAdminRoles),
        body('gameName').isString().notEmpty(),
        body('teams').isArray(),
        body('accessLevel').optional().custom(validateAccessLevel),

        body('chgkSettings.roundsCount')
            .if(body('chgkSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('chgkSettings.questionsCount')
            .if(body('chgkSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('chgkSettings.questions').optional({ nullable: true }).isObject(),

        body('matrixSettings.roundsCount')
            .if(body('matrixSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('matrixSettings.questionsCount')
            .if(body('matrixSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('matrixSettings.roundNames')
            .if(body('matrixSettings').exists({ checkNull: true }))
            .isArray({ min: 0, max: 30 }),
        body('matrixSettings.questions').optional({ nullable: true }).isObject(),

        body('quizSettings.roundsCount')
            .if(body('quizSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('quizSettings.questionsCount')
            .if(body('quizSettings').exists({ checkNull: true }))
            .isInt({ min: 0, max: 30 }),
        body('quizSettings.roundNames')
            .if(body('quizSettings').exists({ checkNull: true }))
            .isArray({ min: 0, max: 30 }),
        body('quizSettings.roundTypes')
            .if(body('quizSettings').exists({ checkNull: true }))
            .isArray({ min: 0, max: 30 })
            .custom(validateRoundTypes),
        body('quizSettings.questions').optional({ nullable: true }).isObject(),

        validationMiddleware,
        asyncHandler(gamesController.insertGame.bind(gamesController))
    );

    return router;
};
