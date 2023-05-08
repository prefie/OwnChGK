import { Request, Response } from 'express';
import { getTokenFromRequest } from '../utils/jwtToken';
import { bigGames, gameAdmins, gameUsers } from '../socket'; // TODO: избавиться
import { Game, GameTypeLogic, Round } from '../logic/Game';
import { Team } from '../logic/Team';
import { BigGameDto } from '../dtos/bigGameDto';
import { BigGameLogic } from '../logic/BigGameLogic';
import { BigGameRepository } from '../db/repositories/bigGameRepository';
import { GameStatus, GameType } from '../db/entities/Game';
import { BigGame } from '../db/entities/BigGame';
import { TeamDto } from '../dtos/teamDto';
import { ChgkSettingsDto } from '../dtos/chgkSettingsDto';
import { MatrixSettingsDto } from '../dtos/matrixSettingsDto';
import { demoAdminRoles, smallAdminRoles, superAdminRoles, userRoles } from '../utils/roles';
import { AccessType, CheckAccessResult } from '../utils/checkAccessResult';

export class GamesController {
    private readonly bigGameRepository: BigGameRepository;

    constructor() {
        this.bigGameRepository = new BigGameRepository();
    }

    public async getAll(req: Request, res: Response) {
        try {
            const { amIParticipate } = req.query;
            let games: BigGame[] = [];
            const { id, role } = getTokenFromRequest(req);
            console.log('user = ', id, 'try to getAllGames');
            if (amIParticipate) {
                games = await this.bigGameRepository.findByCaptainId(id);
            } else if (superAdminRoles.has(role)) {
                games = await this.bigGameRepository.findWithAllRelations();
            } else if (smallAdminRoles.has(role)) {
                games = await this.bigGameRepository.findWithAllRelationsByAdminId(id);
            }

            return res.status(200).json({
                games: games?.map(value => new BigGameDto(value))
            });
        } catch (error) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    // Не юзается, использует название игры из параметров - плохо
    public async getAllTeams(req: Request, res: Response) {
        try {
            const { gameName } = req.params;
            const game = await this.bigGameRepository.findByName(gameName);
            if (!game) {
                return res.status(404).json({ message: 'game not found' });
            }

            return res.status(200).json({
                teams: game.teams?.map(team => new TeamDto(team))
            });
        } catch (error) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async insertGame(req: Request, res: Response) {
        try {
            const { gameName, teams, chgkSettings, matrixSettings } = req.body;

            const { email, id, role } = getTokenFromRequest(req);
            const game = await this.bigGameRepository.findByName(gameName);
            if (game) {
                return res.status(409).json({ message: 'Игра с таким названием уже есть' });
            }

            const gamesCount = await this.bigGameRepository.getQuantityByAdminId(id);
            if (demoAdminRoles.has(role) && gamesCount >= 1) {
                return res.status(403).json({ message: 'Больше 1 игры демо-админ создать не может' });
            }

            await this.bigGameRepository.insertByParams(gameName, email, teams, chgkSettings, matrixSettings);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async deleteGame(req: Request, res: Response) {
        try {
            const { gameId } = req.params;

            const checkAccessResult = await this.CheckAccess(req, gameId);
            if (checkAccessResult.type === AccessType.FORBIDDEN) {
                return res.status(403).json({ message: checkAccessResult.message });
            }

            await this.bigGameRepository.deleteById(gameId);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async editGameName(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            const { newGameName } = req.body;

            const checkAccessResult = await this.CheckAccess(req, gameId);
            if (checkAccessResult.type === AccessType.FORBIDDEN) {
                return res.status(403).json({ message: checkAccessResult.message });
            }

            await this.bigGameRepository.updateNameById(gameId, newGameName);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async editGameAdmin(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            const { adminEmail } = req.body;

            const checkAccessResult = await this.CheckAccess(req, gameId);
            if (checkAccessResult.type === AccessType.FORBIDDEN) {
                return res.status(403).json({ message: checkAccessResult.message });
            }

            await this.bigGameRepository.updateAdminByIdAndAdminEmail(gameId, adminEmail);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async getGame(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            const bigGame = await this.bigGameRepository.findWithAllRelationsByBigGameId(gameId);
            if (!bigGame) {
                return res.status(404).json({ message: 'game not found' });
            }
            const chgk = bigGame.games.find(game => game.type == GameType.CHGK);
            const matrix = bigGame.games.find(game => game.type == GameType.MATRIX);
            const answer = { // TODO: DTO
                name: bigGame.name,
                isStarted: !!bigGames[gameId],
                id: bigGame.id,
                teams: bigGame.teams.map(value => value.name),
                chgkSettings: chgk ? new ChgkSettingsDto(chgk) : null,
                matrixSettings: matrix ? new MatrixSettingsDto(matrix) : null,
            };
            return res.status(200).json(answer);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async startGame(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            const bigGame = await this.bigGameRepository.findWithAllRelationsByBigGameId(gameId);
            if (!bigGame) {
                return res.status(404).json({ message: 'game not found' });
            }
            const { id, role } = getTokenFromRequest(req);
            const additionalAdmins = bigGame.additionalAdmins?.map(a => a.id) ?? [];
            if (smallAdminRoles.has(role) && bigGame.admin.id !== id && additionalAdmins.indexOf(id) === -1) {
                return res.status(403).json({ message: 'Админ/Демо-админ может начать только свою игру' });
            }

            gameAdmins[gameId] = new Set();
            gameUsers[gameId] = new Set();

            const chgkFromDB = bigGame.games.find(game => game.type == GameType.CHGK);
            const matrixFromDB = bigGame.games.find(game => game.type == GameType.MATRIX);
            let matrixSettings: MatrixSettingsDto;
            let chgkSettings: ChgkSettingsDto;

            const chgk = new Game(bigGame.name, GameTypeLogic.ChGK);
            const matrix = new Game(bigGame.name, GameTypeLogic.Matrix);

            if (chgkFromDB) {
                chgkSettings = new ChgkSettingsDto(chgkFromDB);
                for (let i = 0; i < chgkSettings.roundCount; i++) {
                    chgk.addRound(new Round(i + 1, chgkSettings.questionCount, 60, GameTypeLogic.ChGK));
                }

                for (const team of bigGame.teams) {
                    chgk.addTeam(new Team(team.name, team.id));
                }
            }

            if (matrixFromDB) {
                matrixSettings = new MatrixSettingsDto(matrixFromDB);
                for (let i = 0; i < matrixSettings.roundCount; i++) {
                    matrix.addRound(new Round(i + 1, matrixSettings.questionCount, 20, GameTypeLogic.Matrix));
                }

                for (const team of bigGame.teams) {
                    matrix.addTeam(new Team(team.name, team.id));
                }
            }

            bigGames[bigGame.id] = new BigGameLogic(
                bigGame.name,
                chgkFromDB ? chgk : null,
                matrixFromDB ? matrix : null);

            setTimeout(() => {
                delete bigGames[gameId];
                delete gameUsers[gameId];
                delete gameAdmins[gameId];
                console.log('delete game ', bigGames[gameId]);
            }, 1000 * 60 * 60 * 24 * 3); // TODO: избавиться

            const answer = { // TODO: DTO
                name: bigGame.name,
                teams: bigGame.teams.map(value => value.name),
                chgkSettings: chgkSettings,
                matrixSettings: matrixSettings
            };

            await this.bigGameRepository.updateByGameIdAndStatus(gameId, GameStatus.STARTED);
            return res.status(200).json(answer);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async changeGame(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            const { newGameName, teams, chgkSettings, matrixSettings } = req.body;

            const currentGame = await this.bigGameRepository.findWithAllRelationsByBigGameId(gameId);
            if (!currentGame) {
                return res.status(404).json({ message: 'game not found' });
            }

            if (currentGame.name !== newGameName) {
                const game = await this.bigGameRepository.findByName(newGameName);
                if (game) {
                    return res.status(409).json({ message: 'Игра с таким названием уже есть' });
                }
            }

            const checkAccessResult = await this.CheckAccess(req, gameId);
            if (checkAccessResult.type === AccessType.FORBIDDEN) {
                return res.status(403).json({ message: checkAccessResult.message });
            }

            console.log('ChangeGame: ', gameId, ' teams is: ', teams);
            await this.bigGameRepository.updateByParams(gameId, newGameName, teams, chgkSettings, matrixSettings);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    // TODO: почему интрига через запрос, а не в сокетах?
    public async changeIntrigueStatus(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            const { isIntrigue } = req.body;

            if (!bigGames[gameId]) {
                return res.status(404).json({ 'message': 'Игра не началась' });
            }

            const checkAccessResult = await this.CheckAccess(req, gameId, true);
            if (checkAccessResult.type === AccessType.FORBIDDEN) {
                return res.status(403).json({ message: checkAccessResult.message });
            }

            bigGames[gameId].isIntrigue = isIntrigue;
            isIntrigue ? console.log('intrigue started') : console.log('intrigue finished');
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async getGameResult(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            if (!bigGames[gameId]) {
                return res.status(404).json({ 'message': 'Игра не началась' });
            }
            const totalScore = bigGames[gameId].CurrentGame.getTotalScoreForAllTeams();
            const answer = {
                totalScoreForAllTeams: totalScore,
            };
            return res.status(200).json(answer); // TODO: убрать answer

        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async getGameResultScoreTable(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            if (!bigGames[gameId]) {
                return res.status(404).json({ 'message': 'Игра не началась' });
            }

            const { role, teamId } = getTokenFromRequest(req);

            if (userRoles.has(role) && !teamId) {
                return res.status(400).json({ message: 'user without team' });
            }

            const bigGame = bigGames[gameId];
            const game = bigGame.isFullGame() ? bigGame.ChGK : bigGame.CurrentGame;
            const totalScoreForAllTeams = userRoles.has(role) && teamId && bigGame.isIntrigue
                ? game.getScoreTableForTeam(teamId)
                : game.getScoreTable();

            const teamsDictionary = userRoles.has(role) && teamId
                ? game.getTeamDictionary(teamId)
                : game.getAllTeamsDictionary();


            const matrixSums = bigGame.isFullGame() ? bigGame.Matrix.getTotalScoreForAllTeams() : undefined;

            const answer = { // TODO: DTO
                gameId,
                isIntrigue: bigGame.isIntrigue,
                roundsCount: game.rounds.length,
                questionsCount: game.rounds[0].questionsCount,
                matrixSums,
                totalScoreForAllTeams,
                teamsDictionary,
            };

            return res.status(200).json(answer);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async getResultWithFormat(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            if (!bigGames[gameId]) {
                return res.status(404).json({ 'message': 'Игра не началась' });
            }

            const { role, teamId } = getTokenFromRequest(req);

            if (userRoles.has(role) && !teamId) {
                return res.status(400).json({ message: 'user without team' });
            }

            const bigGame = bigGames[gameId];
            const headersList = ['Название команды', 'Сумма']; // TODO: DTO
            if (bigGame.isFullGame()) {
                headersList.push('Матрица');
            }

            const game = bigGame.isFullGame() ? bigGame.ChGK : bigGame.CurrentGame;

            for (let i = 1; i <= game.rounds.length; i++) {
                headersList.push('Тур ' + i);
                for (let j = 1; j <= game.rounds[i - 1].questionsCount; j++) {
                    headersList.push('Вопрос ' + j);
                }
            }

            const teamRows = [];
            const totalScoreForAllTeams = game.getTotalScoreForAllTeams();
            const matrixSums = bigGame.isFullGame() ? bigGame.Matrix.getTotalScoreForAllTeams() : undefined;

            const scoreTable = userRoles.has(role) && teamId && bigGames[gameId].isIntrigue
                ? game.getScoreTableForTeam(teamId)
                : game.getScoreTable();

            let roundsResultList = [];
            for (const team in scoreTable) {
                let roundSum = 0;
                for (let i = 0; i < game.rounds.length; i++) {
                    for (let j = 0; j < game.rounds[i].questionsCount; j++) {
                        roundSum += scoreTable[team][i][j];
                    }
                    roundsResultList.push(roundSum);
                    roundsResultList.push(scoreTable[team][i].join(';'));
                    roundSum = 0;
                }
                teamRows.push(team + ';' + totalScoreForAllTeams[team] + ';' + (matrixSums ? `${matrixSums[team]};` : '') + roundsResultList.join(';'));
                roundsResultList = [];
            }

            const headers = headersList.join(';');
            const value = teamRows.join('\n');

            const answer = {
                totalTable: [headers, value].join('\n')
            };

            console.log(answer.totalTable, 'gameId = ', gameId);
            return res.status(200).json(answer);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async changeGameStatus(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            const { status } = req.body;

            const checkAccessResult = await this.CheckAccess(req, gameId, true);
            if (checkAccessResult.type === AccessType.FORBIDDEN) {
                return res.status(403).json({ message: checkAccessResult.message });
            }

            await this.bigGameRepository.updateByGameIdAndStatus(gameId, status);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async getParticipants(req: Request, res: Response) {
        try {
            const { gameId } = req.params;
            const game = await this.bigGameRepository.findWithAllRelationsByBigGameId(gameId);
            const table = [];
            for (let team of game.teams) {
                table.push(team.name);
                if (team.captain) {
                    table.push(['Капитан', 'Почта'].join(';'));
                    table.push(team.captain.name + ';' + team.captain.email + ';');
                }
                if (team.participants) {
                    table.push(['Имя', 'Почта'].join(';'));
                    const participantsList = [];
                    for (let participant of team.participants) {
                        participantsList.push(participant.name + ';' + participant.email + ';');
                    }
                    table.push(participantsList.join('\n'));
                }
                table.push('\n');

            }

            return res.status(200).json({
                participants: table.join('\n')
            });

        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    private async CheckAccess(req: Request, gameId: string, withAdditionalAdmins = false): Promise<CheckAccessResult> {
        const { id, role } = getTokenFromRequest(req);
        const defaultAnswer = { type: AccessType.ACCESS };
        if (superAdminRoles.has(role)) return defaultAnswer;

        const game = await this.bigGameRepository.findWithAdminRelationsByBigGameId(gameId);
        const additionalAdmins = game.additionalAdmins?.map(a => a.id) ?? [];
        if (game.admin.id !== id && withAdditionalAdmins && additionalAdmins.indexOf(id) === -1) {
            return {
                type: AccessType.FORBIDDEN,
                message: 'Админ/Демо-админ может изменять только свои игры',
            };
        }

        return {
            type: AccessType.ACCESS,
        };
    }
}
