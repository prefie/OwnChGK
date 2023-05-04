import { Router } from 'express';
import { RoundsController } from '../controllers/roundsController';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminAccess } from './mainRouter';
import { body, param } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

export const roundsRouter = () => {
    const router = Router();

    const roundsController = new RoundsController();

    // Пока не используется
    router.get(
        '/',
        authMiddleware,
        body('gameName').isString().notEmpty(),
        validationMiddleware,
        roundsController.getAll.bind(roundsController));

    router.patch(
        '/:gameId/:number/change',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        param('number').isInt(),
        body('newQuestionCount').isInt({ min: 0 }),
        body('newQuestionCost').isInt({ min: 0 }),
        body('newQuestionTime').isInt({ min: 0 }),
        validationMiddleware,
        roundsController.editRound.bind(roundsController));

    router.delete(
        '/:gameId/:number',
        roleMiddleware(adminAccess),
        param('gameId').isUUID(),
        param('number').isInt(),
        validationMiddleware,
        roundsController.deleteRound.bind(roundsController));

    router.post(
        '/',
        roleMiddleware(adminAccess),
        body('number').isInt(),
        body('gameName').isString().notEmpty(),
        body('questionCount').isInt({ min: 0 }),
        body('questionCost').isInt({ min: 0 }),
        body('questionTime').isInt({ min: 0 }),
        validationMiddleware,
        roundsController.insertRound.bind(roundsController));

    return router;
};
