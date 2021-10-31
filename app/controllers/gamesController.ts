import DataBase from '../dbconfig/dbconnector';
import {validationResult} from 'express-validator';
import {Request, Response} from 'express';
import jwt from "jsonwebtoken";
import {secret} from "../jwtToken";


class GamesController {
    public async getAll(req: Request, res: Response) {
        try {
            const games = await DataBase.getAllGames();
            res.send(games);
        } catch (error) {
            res.status(400).json({message: 'Error'}).send(error);
        }
    }

    public async getAllTeams(req: Request, res: Response) {
        try {
            const teams = await DataBase.getGameTeams(req.body.gameId);
            res.send(teams);
        } catch (error) {
            res.status(400).json({message: 'Error'}).send(error);
        }
    }

    public async insertGame(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const name = req.body.gameName;
            const roundsNumber = req.body.roundsNumber;
            const questionsNumber = req.body.questionsNumber;
            const token = req.cookies['authorization'];
            const teamNames = [];
            const payLoad = jwt.verify(token, secret);
            if (typeof payLoad !== "string") {
                const admin = payLoad.id;
                const gameId = await DataBase.insertGame(name, admin);
                for (let i=1; i<=roundsNumber; i++) {
                    await DataBase.insertRound(i, gameId, questionsNumber, 1, 60);
                }
                for (const team of teamNames) {
                    const t = await DataBase.getTeam(team);
                    await DataBase.insertTeamToGame(t.team_id, gameId);
                }
                res.send('Done');
            }
            else {
                res.send("You are not admin");
            }
        } catch (error: any) {
            res.status(400).json({'message': error.message});
        }
    }

    public async deleteGame(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const name = req.body.name;
            await DataBase.deleteGame(name);
            res.send('Done');
        } catch (error: any) {
            res.status(400).json({'message': error.message});
        }
    }

    public async editGameName(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const name = req.body.name;
            const newName = req.body.newName;
            await DataBase.changeGameName(name, newName);
            res.send('Done');
        } catch (error: any) {
            res.status(400).json({'message': error.message});
        }
    }

    public async editGameAdmin(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const name = req.body.name;
            const admin = req.body.admin;
            await DataBase.changeTeamCaptainId(name, admin);
            res.send('Done');
        } catch (error: any) {
            res.status(400).json({'message': error.message});
        }
    }

    public async getGame(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const game = await DataBase.getGame(req.body.name);
            res.send(game);
        } catch (error: any) {
            res.status(400).json({'message': error.message});
        }
    }

    public async changeGameStatus(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const name = req.body.name;
            const status = req.body.status;
            await DataBase.changeGameStatus(name, status);
            res.send('Done');
        } catch (error: any) {
            res.status(400).json({'message': error.message});
        }
    }
}

export default GamesController;