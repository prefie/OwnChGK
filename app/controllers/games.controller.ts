import { Request, Response } from 'express';
import { TeamRepository } from '../db/repositories/team.repository';
import { AccessLevel, BigGame } from '../db/entities/big-game';
import { GameStatus, GameType } from '../db/entities/game';
import { BigGameRepository } from '../db/repositories/big-game.repository';
import { BigGameDto, GameDto, MatrixGameDto, QuizGameDto } from '../dtos/big-game.dto';
import { BigGameLogic } from '../logic/big-game-logic';
import { bigGames, gameAdmins, gameUsers } from '../socket'; // TODO: shusharin избавиться
import { AccessType, CheckAccessResult } from '../utils/check-access-result';
import { getTokenFromRequest } from '../utils/jwt-token';
import { allAdminRoles, demoAdminRoles, smallAdminRoles, superAdminRoles, userRoles } from '../utils/roles';

export class GamesController {
    private readonly bigGameRepository: BigGameRepository;
    private readonly teamRepository: TeamRepository;

    constructor() {
        this.bigGameRepository = new BigGameRepository();
        this.teamRepository = new TeamRepository();
    }

    public async getAll(req: Request, res: Response) {
        const { amIParticipate, publicEnabled } = req.query;
        const { id, role, teamId } = getTokenFromRequest(req);

        let games: BigGame[] = [];
        if (amIParticipate) {
            games = publicEnabled
                ? await this.bigGameRepository.findPublicGamesByCaptainId(id)
                : await this.bigGameRepository.findByCaptainId(id);
        } else if (superAdminRoles.has(role)) {
            games = await this.bigGameRepository.findWithAllRelations();
        } else if (smallAdminRoles.has(role)) {
            games = await this.bigGameRepository.findWithAllRelationsByAdminId(id);
        }

        return res.status(200).json({
            games: games?.map(value => new BigGameDto(value, teamId))
        });
    }

    public async insertGame(req: Request, res: Response) {
        const { gameName, teams, accessLevel, chgkSettings, matrixSettings, quizSettings } = req.body;

        const { email, id, role } = getTokenFromRequest(req);

        const game = await this.bigGameRepository.findByName(gameName);
        if (game) {
            return res.status(409).json({ message: 'Игра с таким названием уже есть' });
        }

        const gamesCount = await this.bigGameRepository.getQuantityByAdminId(id);
        if (demoAdminRoles.has(role) && gamesCount >= 1) {
            return res.status(403).json({ message: 'Больше 1 игры демо-админ создать не может' });
        }

        if (demoAdminRoles.has(role) && accessLevel != AccessLevel.PRIVATE) {
            return res.status(403).json({ message: 'Демо-админ может создавать только приватные игры' });
        }

        await this.bigGameRepository.insertByParams(
            gameName,
            email,
            teams,
            accessLevel,
            chgkSettings,
            matrixSettings,
            quizSettings
        );
        return res.status(200).json({});
    }

    public async deleteGame(req: Request, res: Response) {
        const { gameId } = req.params;

        const checkAccessResult = await this.checkAccess(req, gameId);
        if (checkAccessResult.type == AccessType.FORBIDDEN) {
            return res.status(403).json({ message: checkAccessResult.message });
        }

        await this.bigGameRepository.deleteById(gameId);
        delete bigGames[gameId];
        delete gameUsers[gameId];
        delete gameAdmins[gameId];

        return res.status(200).json({});
    }

    public async editGameName(req: Request, res: Response) {
        const { gameId } = req.params;
        const { newGameName } = req.body;

        const checkAccessResult = await this.checkAccess(req, gameId);
        if (checkAccessResult.type == AccessType.FORBIDDEN) {
            return res.status(403).json({ message: checkAccessResult.message });
        }

        await this.bigGameRepository.updateNameById(gameId, newGameName);
        return res.status(200).json({});
    }

    public async editGameAdmin(req: Request, res: Response) {
        const { gameId } = req.params;
        const { adminEmail } = req.body;

        const checkAccessResult = await this.checkAccess(req, gameId);
        if (checkAccessResult.type == AccessType.FORBIDDEN) {
            return res.status(403).json({ message: checkAccessResult.message });
        }

        await this.bigGameRepository.updateAdminByIdAndAdminEmail(gameId, adminEmail);
        return res.status(200).json({});
    }

    public async getGame(req: Request, res: Response) {
        const { gameId } = req.params;

        const bigGame = await this.bigGameRepository.findWithAllRelationsByBigGameId(gameId);
        if (!bigGame) {
            return res.status(404).json({ message: 'game not found' });
        }

        const chgk = bigGame.games.find(game => game.type == GameType.CHGK);
        const matrix = bigGame.games.find(game => game.type == GameType.MATRIX);
        const quiz = bigGame.games.find(game => game.type == GameType.QUIZ);

        const { role } = getTokenFromRequest(req);

        await this.restoreBigGameIfNeeded(bigGame.id, bigGame.status);

        const answer = {
            // TODO: shusharin DTO
            name: bigGame.name,
            isStarted: !!bigGames[gameId],
            status: bigGame.status,
            id: bigGame.id,
            accessLevel: bigGame.accessLevel,
            teams: bigGame.teams.map(value => value.name),
            chgkSettings: chgk ? new GameDto(chgk, allAdminRoles.has(role)) : null,
            matrixSettings: matrix ? new MatrixGameDto(matrix, allAdminRoles.has(role)) : null,
            quizSettings: quiz ? new QuizGameDto(quiz, allAdminRoles.has(role)) : null
        };

        return res.status(200).json(answer);
    }

    public async startGame(req: Request, res: Response) {
        const { gameId } = req.params;

        const bigGame = await this.bigGameRepository.findWithAllRelationsByBigGameId(gameId);
        if (!bigGame) {
            return res.status(404).json({ message: 'game not found' });
        }

        const checkAccessResult = await this.checkAccess(req, gameId, true);
        if (checkAccessResult.type == AccessType.FORBIDDEN) {
            return res.status(403).json({ message: checkAccessResult.message });
        }

        if (bigGame.status === GameStatus.FINISHED) {
            return res.status(400).json({ message: 'Нельзя начать завершившуюся игру' });
        }

        if (!bigGames[bigGame.id]) {
            gameAdmins[gameId] = new Set();
            gameUsers[gameId] = new Set();

            bigGames[bigGame.id] = await this.bigGameRepository.createBigGameLogic(bigGame);

            setTimeout(
                async () => {
                    await this.bigGameRepository.updateBigGameState(bigGames[gameId]);
                    delete bigGames[gameId];
                    delete gameUsers[gameId];
                    delete gameAdmins[gameId];
                },
                1000 * 60 * 60 * 24
            ); // TODO: shusharin избавиться
        }

        const chgkFromDB = bigGame.games.find(game => game.type == GameType.CHGK);
        const matrixFromDB = bigGame.games.find(game => game.type == GameType.MATRIX);

        const answer = {
            // TODO: shusharin DTO
            name: bigGame.name,
            id: bigGame.id,
            teams: bigGame.teams.map(value => value.name),
            chgkSettings: chgkFromDB ? new GameDto(chgkFromDB) : null,
            matrixSettings: matrixFromDB ? new MatrixGameDto(matrixFromDB) : null
        };

        await this.bigGameRepository.updateByGameIdAndStatus(gameId, GameStatus.STARTED);
        return res.status(200).json(answer);
    }

    public async closeGame(req: Request, res: Response) {
        const { gameId } = req.params;

        const bigGame = await this.bigGameRepository.findWithAdminRelationsByBigGameId(gameId);
        if (!bigGame) {
            return res.status(404).json({ message: 'game not found' });
        }

        const checkAccessResult = await this.checkAccess(req, gameId, true);
        if (checkAccessResult.type == AccessType.FORBIDDEN) {
            return res.status(403).json({ message: checkAccessResult.message });
        }

        await this.bigGameRepository.updateByGameIdAndStatus(gameId, GameStatus.FINISHED);

        if (!bigGames[bigGame.id]) {
            await this.bigGameRepository.updateBigGameState(bigGames[gameId]);
        }

        return res.status(204);
    }

    public async changeGame(req: Request, res: Response) {
        const { gameId } = req.params;

        const { newGameName, accessLevel, chgkSettings, matrixSettings, quizSettings } = req.body;

        const currentGame = await this.bigGameRepository.findById(gameId);
        if (!currentGame) {
            return res.status(404).json({ message: 'game not found' });
        }

        const checkAccessResult = await this.checkAccess(req, gameId);
        if (checkAccessResult.type == AccessType.FORBIDDEN) {
            return res.status(403).json({ message: checkAccessResult.message });
        }

        if (currentGame.status != GameStatus.NOT_STARTED) {
            return res.status(400).json({ message: 'Нельзя редактировать начатые игры' });
        }

        if (currentGame.name !== newGameName) {
            const game = await this.bigGameRepository.findByName(newGameName);
            if (game) {
                return res.status(409).json({ message: 'Игра с таким названием уже есть' });
            }
        }

        const { role } = getTokenFromRequest(req);

        if (demoAdminRoles.has(role) && accessLevel != AccessLevel.PRIVATE) {
            return res.status(403).json({ message: 'Демо-админ может создавать только приватные игры' });
        }

        await this.bigGameRepository.updateByParams(
            gameId,
            newGameName,
            accessLevel,
            chgkSettings,
            matrixSettings,
            quizSettings
        );
        return res.status(200).json({});
    }

    // TODO: shusharin почему интрига через запрос, а не в сокетах?
    public async changeIntrigueStatus(req: Request, res: Response) {
        const { gameId } = req.params;
        const { isIntrigue } = req.body;

        if (!bigGames[gameId]) {
            return res.status(404).json({ message: 'Игра не началась' });
        }

        const checkAccessResult = await this.checkAccess(req, gameId, true);
        if (checkAccessResult.type == AccessType.FORBIDDEN) {
            return res.status(403).json({ message: checkAccessResult.message });
        }

        bigGames[gameId].intrigueEnabled = isIntrigue;
        return res.status(200).json({});
    }

    public async getGameResult(req: Request, res: Response) {
        const { gameId } = req.params;

        if (!bigGames[gameId]) {
            return res.status(404).json({ message: 'Игра не началась' });
        }

        const totalScore = bigGames[gameId].currentGame.getTotalScoreForAllTeams();
        const answer = {
            totalScoreForAllTeams: totalScore
        };

        return res.status(200).json(answer);
    }

    public async getGameResultScoreTable(req: Request, res: Response) {
        const { gameId } = req.params;
        const { role, teamId } = getTokenFromRequest(req);

        if (userRoles.has(role) && !teamId) {
            return res.status(400).json({ message: 'user without team' });
        }

        if (!bigGames[gameId]) {
            const bigGameFromDb = await this.bigGameRepository.findById(gameId);
            await this.restoreBigGameIfNeeded(gameId, bigGameFromDb.status);
        }

        const bigGame = bigGames[gameId];
        const game = bigGame.isFullGame() ? bigGame.chGKGame : bigGame.currentGame;

        const totalScoreForAllTeams =
            userRoles.has(role) && teamId && bigGame.intrigueEnabled ? game.getScoreTableForTeam(teamId) : game.getScoreTable();

        const teamsDictionary = userRoles.has(role) && teamId ? game.getTeamDictionary(teamId) : game.getAllTeamsDictionary();

        const matrixSums = bigGame.isFullGame() ? bigGame.matrixGame.getTotalScoreForAllTeams() : undefined;

        const answer = {
            // TODO: shusharin DTO
            gameId,
            isIntrigue: bigGame.intrigueEnabled,
            roundsCount: game.getRoundsCount(),
            questionsCount: game.rounds[0].questionsCount,
            matrixSums,
            totalScoreForAllTeams,
            teamsDictionary
        };

        return res.status(200).json(answer);
    }

    public async getResultWithFormat(req: Request, res: Response) {
        const { gameId } = req.params;
        const { role, teamId } = getTokenFromRequest(req);

        if (userRoles.has(role) && !teamId) {
            return res.status(400).json({ message: 'user without team' });
        }

        const bigGame = bigGames[gameId];

        if (!bigGame) {
            const bigGameFromDb = await this.bigGameRepository.findById(gameId);
            await this.restoreBigGameIfNeeded(gameId, bigGameFromDb.status);
        } else if (allAdminRoles.has(role)) {
            this.bigGameRepository
                .updateBigGameState(bigGame)
                .catch(e => console.error(`Ошибка при сохранении состояния игры ${bigGame.id} -- ${bigGame.name} -- ${e}`));
        }

        const headersList = ['Название команды', 'Сумма']; // TODO: shusharin убрать эту логику отсюда
        if (bigGame.isFullGame()) {
            headersList.push('Матрица');
        }

        const game = bigGame.isFullGame() ? bigGame.chGKGame : bigGame.currentGame;

        for (let i = 1; i <= game.getRoundsCount(); i++) {
            headersList.push('Тур ' + i);
            for (let j = 1; j <= game.rounds[i - 1].questionsCount; j++) {
                headersList.push('Вопрос ' + j);
            }
        }

        const teamRows = [];
        const totalScoreForAllTeams = game.getTotalScoreForAllTeams();
        const matrixSums = bigGame.isFullGame() ? bigGame.matrixGame.getTotalScoreForAllTeams() : undefined;

        const scoreTable =
            userRoles.has(role) && teamId && bigGames[gameId].intrigueEnabled
                ? game.getScoreTableForTeam(teamId)
                : game.getScoreTable();

        let roundsResultList = [];
        for (const team in scoreTable) {
            let roundSum = 0;
            for (let i = 0; i < game.getRoundsCount(); i++) {
                for (let j = 0; j < game.rounds[i].questionsCount; j++) {
                    roundSum += scoreTable[team][i][j];
                }
                roundsResultList.push(roundSum);
                roundsResultList.push(scoreTable[team][i].join(';'));
                roundSum = 0;
            }
            teamRows.push(
                team +
                    ';' +
                    totalScoreForAllTeams[team] +
                    ';' +
                    (matrixSums ? `${matrixSums[team]};` : '') +
                    roundsResultList.join(';')
            );
            roundsResultList = [];
        }

        const headers = headersList.join(';');
        const value = teamRows.join('\n');

        const answer = {
            totalTable: [headers, value].join('\n')
        };

        return res.status(200).json(answer);
    }

    public async changeGameStatus(req: Request, res: Response) {
        const { gameId } = req.params;
        const { status } = req.body;

        const checkAccessResult = await this.checkAccess(req, gameId, true);
        if (checkAccessResult.type == AccessType.FORBIDDEN) {
            return res.status(403).json({ message: checkAccessResult.message });
        }

        await this.bigGameRepository.updateByGameIdAndStatus(gameId, status);
        return res.status(200).json({});
    }

    public async addTeamInBigGame(req: Request, res: Response) {
        const { gameId } = req.params;
        const { teamId } = req.body;
        const { role, teamId: userTeamId, email } = getTokenFromRequest(req);

        if ((userRoles.has(role) && !userTeamId) || (allAdminRoles.has(role) && !teamId)) {
            return res.status(400).json({ message: 'Нет параметра id команды' });
        }

        const bigGame = await this.bigGameRepository.findAccessLevelAndStatusById(gameId);
        if (bigGame.status != GameStatus.NOT_STARTED) {
            return res.status(400).json({ message: 'Нельзя редактировать начатые игры' });
        }

        if (userRoles.has(role) && bigGame.accessLevel != AccessLevel.PUBLIC) {
            return res.status(403).json({ message: 'Нельзя юзеру присоединиться к непубличной игре' });
        }

        const checkAccessResult = await this.checkAccess(req, gameId, true);
        if (allAdminRoles.has(role) && checkAccessResult.type == AccessType.FORBIDDEN) {
            return res.status(403).json({ message: checkAccessResult.message });
        }

        if (demoAdminRoles.has(role)) {
            const team = await this.teamRepository.findWithCaptainRelationsById(teamId);
            if (team?.captain?.email != email) {
                return res.status(403).json({ message: 'Демо-админ может добавить в игру только команду своего юзера' });
            }
        }

        const id = userRoles.has(role) ? userTeamId : teamId;
        const updatedBigGame = await this.bigGameRepository.addTeamInBigGame(gameId, id);
        return res.status(200).json(new BigGameDto(updatedBigGame, id));
    }

    public async deleteTeamFromBigGame(req: Request, res: Response) {
        const { gameId } = req.params;
        const { teamId } = req.body;
        const { role, teamId: userTeamId } = getTokenFromRequest(req);

        if ((userRoles.has(role) && !userTeamId) || (allAdminRoles.has(role) && !teamId)) {
            return res.status(400).json({ message: 'Нет параметра id команды' });
        }

        const bigGame = await this.bigGameRepository.findAccessLevelAndStatusById(gameId);
        if (bigGame.status != GameStatus.NOT_STARTED) {
            return res.status(400).json({ message: 'Нельзя редактировать начатые игры' });
        }

        const checkAccessResult = await this.checkAccess(req, gameId, true);
        if (allAdminRoles.has(role) && checkAccessResult.type == AccessType.FORBIDDEN) {
            return res.status(403).json({ message: checkAccessResult.message });
        }

        const id = userRoles.has(role) ? userTeamId : teamId;
        const updatedBigGame = await this.bigGameRepository.deleteTeamFromBigGame(gameId, id);
        return res.status(200).json(new BigGameDto(updatedBigGame, id));
    }

    public async getParticipants(req: Request, res: Response) {
        const { gameId } = req.params;

        const game = await this.bigGameRepository.findWithAllRelationsByBigGameId(gameId);
        const table = [];
        const sortedTeams = game.teams.sort((a, b) => (a.createdDate > b.createdDate ? 1 : -1));
        for (let team of sortedTeams) {
            table.push([team.name, team.createdDate].join(';'));
            if (team.captain) {
                table.push(['Капитан', 'Почта'].join(';'));
                table.push(team.captain.name + ';' + team.captain.email);
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
    }

    private async restoreBigGameIfNeeded(gameId: string, status: string): Promise<BigGameLogic> {
        if (bigGames[gameId]) return;

        if (status == GameStatus.STARTED || status == GameStatus.FINISHED) {
            bigGames[gameId] = await this.bigGameRepository.restoreBigGame(gameId);
            gameAdmins[gameId] = new Set();
            gameUsers[gameId] = new Set();

            setTimeout(
                async () => {
                    await this.bigGameRepository.updateBigGameState(bigGames[gameId]);
                    delete bigGames[gameId];
                    delete gameUsers[gameId];
                    delete gameAdmins[gameId];
                },
                1000 * 60 * 60 * 24
            ); // TODO: shusharin избавиться

            return bigGames[gameId];
        }
    }

    private async checkAccess(req: Request, gameId: string, withAdditionalAdmins = false): Promise<CheckAccessResult> {
        const { id, role } = getTokenFromRequest(req);

        const defaultAnswer = { type: AccessType.ACCESS };
        if (superAdminRoles.has(role)) return defaultAnswer;

        const game = await this.bigGameRepository.findWithAdminRelationsByBigGameId(gameId);
        const additionalAdmins = game.additionalAdmins?.map(a => a.id) ?? [];
        if (game.admin.id !== id && withAdditionalAdmins && additionalAdmins.indexOf(id) == -1) {
            return {
                type: AccessType.FORBIDDEN,
                message: 'Админ/Демо-админ может изменять только свои игры'
            };
        }

        return {
            type: AccessType.ACCESS
        };
    }
}
