import { EntityManager, In, Repository } from 'typeorm';
import { BigGame } from '../entities/BigGame';
import { Admin } from '../entities/Admin';
import { Team } from '../entities/Team';
import { Game, GameStatus, GameType } from '../entities/Game';
import { Round } from '../entities/Round';
import { AppDataSource } from '../../data-source';
import { Question } from '../entities/Questions';
import { BaseRepository } from './baseRepository';


export interface ChgkSettings {
    roundCount: number,
    questionCount: number,
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
            }
        });
    }

    findWithAllRelations() {
        return this.innerRepository.find({
            relations: {
                games: { rounds: { questions: true } },
                teams: { captain: true },
            }
        });
    }

    findWithAllRelationsByAdminId(adminId: string) {
        return this.innerRepository.find({
            where: [{ admin: { id: adminId } }, { additionalAdmins: { id: adminId } }],
            relations: {
                games: { rounds: { questions: true } },
                teams: { captain: true },
            }
        });
    }

    findAmIParticipate(userId: string) {
        return this.innerRepository.find({
            where: { teams: { captain: { id: userId } } },
            relations: {
                games: { rounds: { questions: true } },
                teams: { captain: true },
            }
        });
    }

    async insertByParams(name: string,
                         adminEmail: string,
                         teams: string[],
                         chgkSettings: ChgkSettings,
                         matrixSettings: MatrixSettings) {
        const admin = await this.innerRepository.manager.findOneBy<Admin>(Admin, { email: adminEmail.toLowerCase() });
        const teamsFromDb = await this.innerRepository.manager.findBy<Team>(Team, { name: In(teams) });
        const bigGame = new BigGame();
        bigGame.name = name;
        bigGame.admin = admin;
        bigGame.teams = teamsFromDb;

        return this.innerRepository.manager.transaction(async (manager: EntityManager) => {
            await manager.save(bigGame);
            if (chgkSettings) {
                const chgk = new Game();
                chgk.type = GameType.CHGK;
                chgk.bigGame = bigGame;

                await manager.save(chgk);

                await this.createRoundsWithQuestions(
                    manager,
                    chgkSettings?.roundCount ?? 0,
                    chgkSettings?.questionCount ?? 0,
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

                await this.createRoundsWithQuestions(
                    manager,
                    matrixSettings?.roundCount ?? 0,
                    matrixSettings?.questionCount ?? 0,
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

    async updateByParams(bigGameId: string,
                         newName: string,
                         teams: string[],
                         chgkSettings: ChgkSettings,
                         matrixSettings: MatrixSettings) {
        const teamsFromDb = await this.innerRepository.manager.findBy<Team>(Team, { name: In(teams) });
        const bigGame = await this.innerRepository.manager.findOne<BigGame>(BigGame, {
            where: { id: bigGameId },
            relations: { games: true }
        });
        bigGame.teams = teamsFromDb;
        bigGame.name = newName;

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

                await this.createRoundsWithQuestions(
                    manager,
                    chgkSettings?.roundCount ?? 0,
                    chgkSettings?.questionCount ?? 0,
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

                await this.createRoundsWithQuestions(
                    manager,
                    matrixSettings?.roundCount ?? 0,
                    matrixSettings?.questionCount ?? 0,
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
        const admin = await this.innerRepository.manager.findOneBy<Admin>(Admin, { email: newAdminEmail.toLowerCase() });
        const bigGame = await this.innerRepository.findOneBy({ id: bigGameId });
        bigGame.admin = admin;

        return this.innerRepository.save(bigGame);
    }

    async updateByGameIdAndStatus(bigGameId: string, newStatus: GameStatus) {
        const bigGame = await this.innerRepository.findOneBy({ id: bigGameId });
        bigGame.status = newStatus;

        return this.innerRepository.save(bigGame);
    }

    private async createRoundsWithQuestions(
        manager: EntityManager, roundCount: number, questionCount: number, game: Game,
        questionTime: number, questionCost: number, roundNames?: string[],
        questionsText?: Record<number, string[]>) {
        if (roundNames && roundCount !== roundNames.length) {
            throw new Error('roundNames.length !== roundCount');
        }

        for (let i = 1; i <= roundCount; i++) {
            const round = new Round();
            round.number = i;
            round.game = game;
            round.questionTime = questionTime;
            round.name = roundNames ? roundNames[i - 1] : null;
            await manager.save(round);

            const questions = [];
            for (let j = 1; j <= questionCount; j++) {
                const question = new Question();
                question.number = j;
                question.cost = game.type === GameType.CHGK ? j * questionCost : questionCost;
                question.round = round;
                question.text = Object.keys(questionsText).length !== 0 ? questionsText[i][j - 1] : null;

                questions.push(question);
            }

            await manager.save(questions);
        }
    }
}
