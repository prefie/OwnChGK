import { RoundRepository } from '../db/repositories/roundRepository';
import { validationResult } from 'express-validator';
import { Request, Response } from 'express';
import { RoundDto } from '../dtos/roundDto';


export class RoundsController {
    private readonly roundRepository: RoundRepository;

    constructor() {
        this.roundRepository = new RoundRepository();
    }

    public async getAll(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(errors);
            }

            const { gameName } = req.body;

            const rounds = await this.roundRepository.findByGameName(gameName);
            return res.status(200).json(rounds?.map(round => new RoundDto(round)));
        } catch (error) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async insertRound(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(errors);
            }

            const {
                number,
                gameName,
                questionCount,
                questionCost,
                questionTime
            } = req.body;

            await this.roundRepository.insertByParams(
                number,
                gameName,
                questionCount,
                questionCost,
                questionTime);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async deleteRound(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(errors);
            }

            const { gameId, number } = req.params;
            await this.roundRepository.deleteByGameNameAndNumber(gameId, +number);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async editRound(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(errors);
            }

            const { gameId, number } = req.params;
            const {
                newQuestionCount,
                newQuestionCost,
                newQuestionTime
            } = req.body;

            await this.roundRepository.updateByParams(+number, gameId, newQuestionCount, newQuestionCost, newQuestionTime);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }
}
