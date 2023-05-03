import { EntityManager, Repository } from 'typeorm';
import { Round } from '../entities/Round';
import { GameType } from '../entities/Game';
import { BigGame } from '../entities/BigGame';
import { Question } from '../entities/Questions';
import { AppDataSource } from '../../data-source';
import { BaseRepository } from './baseRepository';

export class RoundRepository extends BaseRepository<Round> {
    constructor() {
        super(AppDataSource.getRepository(Round));
    }

    async findByGameName(gameName: string) {
        const bigGame = await this.innerRepository.manager.findOne<BigGame>(BigGame, {
            where: { name: gameName },
            relations: { games: { rounds: true } }
        });
        const game = bigGame.games.find(game => game.type == GameType.CHGK);

        return game.rounds;
    }

    async insertByParams(number: number,
                         gameName: string,
                         questionCount: number,
                         questionCost: number,
                         questionTime: number) {
        const bigGame = await this.innerRepository.manager.findOne<BigGame>(BigGame, {
            where: { name: gameName },
            relations: { games: { rounds: true } }
        });
        const game = bigGame.games.find(game => game.type == GameType.CHGK);
        return await this.innerRepository.manager.transaction(async (manager: EntityManager) => {
            const round = new Round();
            round.number = number;
            round.game = game;
            round.questionTime = questionTime;

            const questions = [];
            for (let i = 1; i <= questionCount; i++) {
                const question = new Question();
                question.cost = questionCost;
                question.round = round;
                questions.push(question);
            }

            await manager.save<Round>(round);
            await manager.save<Question>(questions);
        });
    }

    async deleteByGameNameAndNumber(bigGameId: string, number: number) {
        const bigGame = await this.innerRepository.manager.findOne<BigGame>(BigGame, {
            where: { id: bigGameId },
            relations: { games: { rounds: true } }
        });
        const game = bigGame.games.find(game => game.type == GameType.CHGK);

        return this.innerRepository.delete({ game: { id: game.id }, number });
    }

    async updateByParams(number: number,
                         bigGameId: string,
                         newQuestionNumber: number,
                         newQuestionCost: number,
                         newQuestionTime: number) {
        const bigGame = await this.innerRepository.manager.findOne<BigGame>(BigGame, {
            where: { id: bigGameId },
            relations: { games: { rounds: true } }
        });
        const game = bigGame.games.find(game => game.type == GameType.CHGK);
        return this.innerRepository.manager.transaction(async (manager: EntityManager) => {
            const round = new Round();
            round.number = number;
            round.game = game;
            round.questionTime = newQuestionTime;

            const questions = [];
            for (let i = 1; i <= newQuestionCost; i++) {
                const question = new Question();
                question.cost = newQuestionCost;
                question.round = round;
                questions.push(question);
            }

            await manager.delete<Round>(Round, { game: { id: game.id }, number });
            await manager.save<Round>(round);
            await manager.save<Question>(questions);
        });
    }
}
