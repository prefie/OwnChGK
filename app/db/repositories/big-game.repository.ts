import { EntityManager, In } from 'typeorm';
import { AccessLevel, BigGame } from '../entities/big-game';
import { Admin } from '../entities/admin';
import { Team } from '../entities/team';
import { Game, GameStatus, GameType } from '../entities/game';
import { Round } from '../entities/round';
import { AppDataSource } from '../../utils/data-source';
import { Question } from '../entities/question';
import { BaseRepository } from './base.repository';
import { BigGameLogic } from '../../logic/big-game-logic';
import { Answer, AnswerStatus } from '../entities/answer';
import { Appeal, AppealStatus } from '../entities/appeal';
import { GameTypeLogic } from '../../logic/enums/game-type-logic.enum';
import { Game as GameLogic } from '../../logic/game';
import { Question as QuestionLogic } from '../../logic/question';
import { Round as RoundLogic } from '../../logic/round';
import { Team as TeamLogic } from '../../logic/team';
import { Answer as AnswerLogic } from '../../logic/answer';
import { Appeal as AppealLogic } from '../../logic/appeal';


export interface ChgkSettings {
    roundsCount: number,
    questionsCount: number,
    questionCost: number,
    questionTime: number,
    questions: Record<number, string[]>
}

export interface MatrixSettings extends ChgkSettings {
    roundNames: string[];
}

export class BigGameRepository extends BaseRepository<BigGame> {
    constructor() {
        super(AppDataSource.getRepository(BigGame));
    }

    findByName(name: string) {
        return this.innerRepository.findOne({
            where: { name },
            relations: { games: true, teams: true }
        });
    }

    findWithAllRelationsByBigGameId(bigGameId: string) {
        return this.innerRepository.findOne({
            where: { id: bigGameId },
            relations: {
                games: { rounds: { questions: true } },
                teams: { captain: true },
                admin: true,
                additionalAdmins: true,
            }
        });
    }

    findWithAdminRelationsByBigGameId(bigGameId: string) {
        return this.innerRepository.findOne({
            select: {
                id: true,
                admin: { id: true },
                additionalAdmins: { id: true },
            },
            where: { id: bigGameId },
            relations: {
                admin: true,
                additionalAdmins: true,
            }
        });
    }

    findWithAllRelations() {
        return this.innerRepository.find({
            relations: {
                games: { rounds: { questions: true } },
                teams: { captain: true },
                admin: true,
                additionalAdmins: true,
            }
        });
    }

    findWithAllRelationsByAdminId(adminId: string) {
        return this.innerRepository.find({
            where: [{ admin: { id: adminId } }, { additionalAdmins: { id: adminId } }],
            relations: {
                games: { rounds: { questions: true } },
                teams: { captain: true },
                admin: true,
                additionalAdmins: true,
            }
        });
    }

    getQuantityByAdminId(adminId: string) {
        return this.innerRepository.count({
            where: { admin: { id: adminId } }
        });
    }

    findAccessLevelAndStatusById(bigGameId: string) {
        return this.innerRepository.findOne({
            select: { id: true, accessLevel: true, status: true },
            where: { id: bigGameId }
        });
    }

    async addTeamInBigGame(bigGameId: string, teamId: string) {
        const team = await this.innerRepository.manager.findOne<Team>(Team, {
            where: { id: teamId },
            relations: { bigGames: true }
        });
        const bigGame = await this.findWithAllRelationsByBigGameId(bigGameId);

        if (bigGame.teams.map(t => t.id).indexOf(teamId) == -1) {
            team.bigGames.push(bigGame);
            bigGame.teams.push(team);
        }

        await this.innerRepository.manager.save(Team, team);
        return bigGame;
    }

    async deleteTeamFromBigGame(bigGameId: string, teamId: string) {
        const team = await this.innerRepository.manager.findOne<Team>(Team, {
            where: { id: teamId },
            relations: { bigGames: true }
        });
        const bigGame = await this.findWithAllRelationsByBigGameId(bigGameId);
        team.bigGames = team.bigGames.filter(g => g.id != bigGameId);
        bigGame.teams = bigGame.teams.filter(t => t.id != teamId);

        await this.innerRepository.manager.save(Team, team);
        return bigGame;
    }

    findByCaptainId(userId: string) {
        return this.innerRepository.manager.transaction(async (manager: EntityManager) => {
            const games = await manager.find<BigGame>(BigGame, {
                select: { id: true },
                where: { teams: { captain: { id: userId } } },
                relations: {
                    teams: { captain: true },
                }
            });

            const gameIds = games?.map(g => g.id) ?? [];

            return gameIds.length > 0 ? await BigGameRepository.findByGameIds(manager, gameIds) : [];
        });
    }

    findPublicGamesByCaptainId(userId: string) {
        return this.innerRepository.manager.transaction(async (manager: EntityManager) => {
            const games = await manager.find<BigGame>(BigGame, {
                select: { id: true },
                where: [{ teams: { captain: { id: userId } } }, { accessLevel: AccessLevel.PUBLIC }],
                relations: {
                    teams: { captain: true },
                }
            });

            const gameIds = games?.map(g => g.id) ?? [];

            return gameIds.length > 0 ? await BigGameRepository.findByGameIds(manager, gameIds) : [];
        });
    }

    private static async findByGameIds(manager: EntityManager, gameIds: string[]): Promise<BigGame[]> {
        if (gameIds.length < 1) return [];

        return await manager.find<BigGame>(BigGame, {
            where: { id: In(gameIds) },
            relations: {
                games: { rounds: { questions: true } },
                teams: { captain: true }
            }
        });
    }

    async insertByParams(
        name: string,
        adminEmail: string,
        teams: string[],
        accessLevel: AccessLevel | undefined,
        chgkSettings: ChgkSettings,
        matrixSettings: MatrixSettings
    ) {
        const admin = await this.innerRepository.manager
            .findOneBy<Admin>(Admin, { email: adminEmail.toLowerCase() });
        const teamsFromDb = await this.innerRepository.manager
            .findBy<Team>(Team, { name: In(teams) });
        const bigGame = new BigGame();
        bigGame.name = name;
        bigGame.admin = admin;
        bigGame.teams = teamsFromDb;
        bigGame.accessLevel = accessLevel ?? AccessLevel.PRIVATE;

        return this.innerRepository.manager.transaction(async (manager: EntityManager) => {
            await manager.save(bigGame);
            if (chgkSettings) {
                const chgk = new Game();
                chgk.type = GameType.CHGK;
                chgk.bigGame = bigGame;

                await manager.save(chgk);

                await BigGameRepository.createRoundsWithQuestions(
                    manager,
                    chgkSettings?.roundsCount ?? 0,
                    chgkSettings?.questionsCount ?? 0,
                    chgk,
                    chgkSettings?.questionTime ?? 60,
                    chgkSettings?.questionCost ?? 1,
                    null,
                    chgkSettings?.questions ?? null
                );
            }

            if (matrixSettings) {
                const matrix = new Game();
                matrix.type = GameType.MATRIX;
                matrix.bigGame = bigGame;

                await manager.save(matrix);

                await BigGameRepository.createRoundsWithQuestions(
                    manager,
                    matrixSettings?.roundsCount ?? 0,
                    matrixSettings?.questionsCount ?? 0,
                    matrix,
                    matrixSettings?.questionTime ?? 20,
                    matrixSettings?.questionCost ?? 10,
                    matrixSettings?.roundNames ?? null,
                    matrixSettings?.questions ?? null
                );
            }

            return bigGame;
        });
    }

    async updateByParams(
        bigGameId: string,
        newName: string,
        teams: string[],
        accessLevel: AccessLevel | undefined,
        chgkSettings: ChgkSettings,
        matrixSettings: MatrixSettings
    ) {
        const teamsFromDb = await this.innerRepository.manager.findBy<Team>(Team, { name: In(teams) });
        const bigGame = await this.innerRepository.manager.findOne<BigGame>(BigGame, {
            where: { id: bigGameId },
            relations: { games: true }
        });
        bigGame.teams = teamsFromDb;
        bigGame.name = newName;
        bigGame.accessLevel = accessLevel ?? AccessLevel.PRIVATE;

        const chgk = bigGame.games.find(game => game.type == GameType.CHGK);
        const matrix = bigGame.games.find(game => game.type == GameType.MATRIX);
        return this.innerRepository.manager.transaction(async (manager: EntityManager) => {
            await manager.save(bigGame);
            if (chgk) {
                await manager.delete(Game, { id: chgk.id });
            }
            if (matrix) {
                await manager.delete(Game, { id: matrix.id });
            }
            if (chgkSettings) {
                const game = new Game();
                game.type = GameType.CHGK;
                game.bigGame = bigGame;

                await manager.save(game);

                await BigGameRepository.createRoundsWithQuestions(
                    manager,
                    chgkSettings?.roundsCount ?? 0,
                    chgkSettings?.questionsCount ?? 0,
                    game,
                    chgkSettings?.questionTime ?? 60,
                    chgkSettings?.questionCost ?? 1,
                    null,
                    chgkSettings?.questions ?? null
                );
            }

            if (matrixSettings) {
                const game = new Game();
                game.type = GameType.MATRIX;
                game.bigGame = bigGame;
                await manager.save(game);

                await BigGameRepository.createRoundsWithQuestions(
                    manager,
                    matrixSettings?.roundsCount ?? 0,
                    matrixSettings?.questionsCount ?? 0,
                    game,
                    matrixSettings?.questionTime ?? 20,
                    matrixSettings?.questionCost ?? 10,
                    matrixSettings?.roundNames ?? null,
                    matrixSettings?.questions ?? null
                );
            }

            return bigGame;
        });
    }

    async updateNameById(bigGameId: string, newName: string) {
        const bigGame = await this.innerRepository.findOneBy({ id: bigGameId });
        bigGame.name = newName;

        return this.innerRepository.save(bigGame);
    }

    async updateAdminByIdAndAdminEmail(bigGameId: string, newAdminEmail: string) {
        const admin = await this.innerRepository.manager
            .findOneBy<Admin>(Admin, { email: newAdminEmail.toLowerCase() });
        const bigGame = await this.innerRepository.findOneBy({ id: bigGameId });
        bigGame.admin = admin;

        return this.innerRepository.save(bigGame);
    }

    async updateByGameIdAndStatus(bigGameId: string, newStatus: GameStatus) {
        const bigGame = await this.innerRepository.findOneBy({ id: bigGameId });
        bigGame.status = newStatus;

        return this.innerRepository.save(bigGame);
    }

    async updateBigGameState(bigGame: BigGameLogic) {
        const bigGameFromDb = await this.findWithAllRelationsByBigGameId(bigGame.id);
        const teams: Record<string, Team> = {};
        for (let team of bigGameFromDb.teams) {
            teams[team.id] = team;
        }

        const questions: Record<string, Question> = {};
        const questionsFromDb = bigGameFromDb.games
            .map(g => g.rounds)
            .reduce((arr, e) => arr.concat(e), [])
            .map(r => r.questions)
            .reduce((arr, e) => arr.concat(e), []);
        for (let question of questionsFromDb) {
            questions[question.id] = question;
        }

        const questionsFromCurrentGame = [bigGame.chGKGame, bigGame.matrixGame]
            .filter(g => g)
            .map(g => g.roundValues)
            .reduce((arr, e) => arr.concat(e), [])
            .map(r => r.questions)
            .reduce((arr, e) => arr.concat(e), []);

        const answers: Answer[] = [];
        const appeals: Appeal[] = [];

        for (let question of questionsFromCurrentGame) {
            for (let answerFromCurrentGame of question.answers) {
                const answer = new Answer();
                answer.text = answerFromCurrentGame.text;
                answer.status = answerFromCurrentGame.status;
                answer.question = questions[question.id];
                answer.score = answerFromCurrentGame.score;
                answer.team = teams[answerFromCurrentGame.teamId];

                answers.push(answer);

                if (answerFromCurrentGame.appeal) {
                    const appeal = new Appeal();
                    appeal.text = answerFromCurrentGame.appeal.text;
                    appeal.comment = answerFromCurrentGame.appeal.comment;
                    appeal.status = answerFromCurrentGame.appeal.status;
                    appeal.answer = answer;

                    appeals.push(appeal);
                }
            }
        }

        return this.innerRepository.manager.transaction(async (manager: EntityManager) => {
            await manager.delete(Answer, { question: { id: In(questionsFromCurrentGame.map(q => q.id)) } });
            await manager.save(answers);
            await manager.save(appeals);
        });
    }

    async restoreBigGame(bigGameId: string): Promise<BigGameLogic> {
        const bigGame = await this.innerRepository.findOne({
            where: { id: bigGameId },
            relations: {
                games: { rounds: { questions: { answers: { appeal: true, team: true } } } },
                teams: { captain: true },
            }
        });

        return this.createBigGameLogic(bigGame);
    }

    private static async createRoundsWithQuestions(
        manager: EntityManager, roundsCount: number, questionsCount: number, game: Game,
        questionTime: number, questionCost: number, roundNames?: string[],
        questionsText?: Record<number, string[]>) {
        if (roundNames && roundsCount !== roundNames.length) {
            throw new Error('roundNames.length !== roundsCount');
        }

        for (let i = 1; i <= roundsCount; i++) {
            const round = new Round();
            round.number = i;
            round.game = game;
            round.questionTime = questionTime;
            round.name = roundNames ? roundNames[i - 1] : null;
            await manager.save(round);

            const questions = [];
            for (let j = 1; j <= questionsCount; j++) {
                const question = new Question();
                question.number = j;
                question.cost = game.type == GameType.MATRIX ? j * questionCost : questionCost;
                question.round = round;
                question.text = Object.keys(questionsText).length !== 0 ? questionsText[i][j - 1] : null;

                questions.push(question);
            }

            await manager.save(questions);
        }
    }

    async createBigGameLogic(bigGame: BigGame) {
        const chgkFromDB = bigGame.games.find(game => game.type == GameType.CHGK);
        const matrixFromDB = bigGame.games.find(game => game.type == GameType.MATRIX);

        let chgk: GameLogic;
        let matrix: GameLogic;

        if (chgkFromDB) {
            chgk = new GameLogic(chgkFromDB.id, bigGame.name, GameTypeLogic.ChGK);
            for (const team of bigGame.teams) {
                chgk.addTeam(new TeamLogic(team.name, team.id));
            }

            const rounds = this.getRoundsLogicFromDb(chgkFromDB.rounds);
            chgk.addRounds(rounds);
        }

        if (matrixFromDB) {
            matrix = new GameLogic(matrixFromDB.id, bigGame.name, GameTypeLogic.Matrix);
            for (const team of bigGame.teams) {
                matrix.addTeam(new TeamLogic(team.name, team.id));
            }

            const rounds = this.getRoundsLogicFromDb(matrixFromDB.rounds);
            matrix.addRounds(rounds);
        }

        return new BigGameLogic(
            bigGame.id,
            bigGame.name,
            chgkFromDB ? chgk : null,
            matrixFromDB ? matrix : null
        );
    }

    private getRoundsLogicFromDb(rounds: Round[]): RoundLogic[] {
        return rounds.map(r => {
            const questions = r.questions.map(q => {
                const answers = q.answers?.map(a => new AnswerLogic(
                    a.team.id,
                    r.number,
                    q.number,
                    a.text,
                    a.status as AnswerStatus,
                    a.score
                ));

                const appeals = q.answers
                    ?.filter(a => a.appeal)
                    .map(a => new AppealLogic(
                        a.team.id,
                        r.number,
                        q.number,
                        a.appeal.text,
                        a.text,
                        a.appeal.status as AppealStatus,
                        a.appeal.comment
                    ));
                return new QuestionLogic(
                    q.id,
                    q.cost,
                    r.number,
                    q.number,
                    r.questionTime,
                    q.text,
                    answers,
                    appeals
                );
            });

            return new RoundLogic(
                r.id,
                r.number,
                questions.length,
                r.questionTime,
                GameTypeLogic.ChGK,
                questions
            );
        });
    }
}
