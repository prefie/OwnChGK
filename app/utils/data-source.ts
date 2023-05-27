import { DataSource } from 'typeorm';
import { Game } from '../db/entities/game';
import { User } from '../db/entities/user';
import { Admin } from '../db/entities/admin';
import { Team } from '../db/entities/team';
import { Round } from '../db/entities/round';
import { BigGame } from '../db/entities/big-game';
import { Question } from '../db/entities/question';
import { AppConfig } from './app-config';
import { Answer } from '../db/entities/answer';
import { Appeal } from '../db/entities/appeal';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: AppConfig.databaseUrl,
    entities: [User, Admin, Team, BigGame, Game, Round, Question, Answer, Appeal],
    synchronize: true,
});
