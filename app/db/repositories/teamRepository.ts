import { Participant, Team } from '../entities/Team';
import { User } from '../entities/User';
import { AppDataSource } from '../../data-source';
import { BaseRepository } from './baseRepository';
import { IsNull } from 'typeorm';

export class TeamRepository extends BaseRepository<Team> {
    constructor() {
        super(AppDataSource.getRepository(Team));
    }

    findWithCaptainRelations() {
        return this.innerRepository.find({
            relations: { captain: true }
        });
    }

    findByName(name: string) {
        return this.innerRepository.findOne({
            where: { name },
            relations: { captain: true }
        });
    }

    findByIdWithRelations(id: string) {
        return this.innerRepository.findOne({
            where: { id },
            relations: { captain: true, bigGames: true }
        });
    }

    findTeamsWithoutUser() {
        return this.innerRepository.find({
            where: { captain: { id: IsNull() } },
            relations: { captain: true }
        });
    }

    async insertTeam(name: string, userEmail: string, participants: Participant[]) {
        const captain = userEmail
            ? await this.innerRepository.manager.findOneBy<User>(User, { email: userEmail })
            : null;
        const team = new Team();
        team.name = name;
        team.captain = captain;
        team.participants = participants;

        return this.innerRepository.save(team);
    }

    deleteByName(name: string) {
        return this.innerRepository.delete({ name });
    }

    async updateByParams(teamId: string, newName: string, captainEmail: string, participants: Participant[]) {
        const team = await this.innerRepository.findOneBy({ id: teamId });
        const captain = captainEmail
            ? await this.innerRepository.manager.findOneBy<User>(User, { email: captainEmail })
            : null;
        team.name = newName;
        team.captain = captain;
        team.participants = participants;

        return this.innerRepository.save(team);
    }

    async updateEmptyTeamByIdAndUserEmail(teamId: string, userId: string) {
        const team = await this.innerRepository.findOne({
            where: { id: teamId },
            relations: { captain: true }
        });
        if (team.captain !== null) {
            throw new Error('Команда уже с капитаном');
        }

        team.captain = await this.innerRepository.manager.findOneBy<User>(User, { id: userId });
        return this.innerRepository.save(team);
    }

    async deleteTeamCaptainByIdAndUserEmail(teamId: string) {
        const team = await this.innerRepository.findOne({
            where: { id: teamId },
            relations: { captain: true }
        });
        if (team.captain === null) {
            throw new Error('Команда уже без капитана');
        }

        team.captain = null;
        return this.innerRepository.save(team);
    }
}
