import { DataSource } from 'typeorm';
import { Game } from '../db/entities/Game';
import { User } from '../db/entities/User';
import { Admin } from '../db/entities/Admin';
import { Team } from '../db/entities/Team';
import { Round } from '../db/entities/Round';
import { BigGame } from '../db/entities/BigGame';
import { Question } from '../db/entities/Questions';
import { AppConfig } from './app-config';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: AppConfig.databaseUrl,
    entities: [User, Admin, Team, BigGame, Game, Round, Question],
    synchronize: true,
});
