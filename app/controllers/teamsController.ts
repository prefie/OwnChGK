import { TeamRepository } from '../db/repositories/teamRepository';
import { Request, Response } from 'express';
import { generateAccessToken, getTokenFromRequest, setTokenInResponse } from '../utils/jwtToken';
import { TeamDto } from '../dtos/teamDto';
import { BigGameDto } from '../dtos/bigGameDto';
import { Participant, Team } from '../db/entities/Team';
import { UserRepository } from '../db/repositories/userRepository';
import { demoAdminRoles, realAdminRoles, userRoles } from '../utils/roles';


export class TeamsController {
    private readonly teamRepository: TeamRepository;
    private readonly userRepository: UserRepository;

    constructor() {
        this.teamRepository = new TeamRepository();
        this.userRepository = new UserRepository();
    }

    public async getAll(req: Request, res: Response) {
        try {
            const { withoutUser } = req.query;
            const { email, role } = getTokenFromRequest(req);
            let teams: Team[];
            if (demoAdminRoles.has(role)) {
                const team = await this.teamRepository.findByCaptainEmail(email);
                teams = team ? [team] : [];
            } else {
                teams = withoutUser
                    ? await this.teamRepository.findTeamsWithoutUser()
                    : await this.teamRepository.findWithCaptainRelations();
            }

            return res.status(200).json({
                teams: teams?.map(value => new TeamDto(value))
            });
        } catch (error) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async insertTeam(req: Request, res: Response) {
        try {
            const { teamName, captain, participants } = req.body;

            const {
                id,
                email,
                role,
                name,
            } = getTokenFromRequest(req);

            if (!realAdminRoles.has(role) && email.toLowerCase() !== captain?.toLowerCase()) {
                return res.status(403).json({
                    message: 'Юзеру/демо-админу нельзя создать команду с другим капитаном',
                });
            }

            const team = await this.teamRepository.findByName(teamName);
            if (team) {
                return res.status(409).json({ message: 'Команда с таким названием уже есть' });
            }

            const mappedParticipants = participants?.map(value => new Participant(value.email, value.name)); // избавляемся от мусора в JSON
            const newTeam = await this.teamRepository.insertTeam(teamName, captain, mappedParticipants);

            if (userRoles.has(role) && captain) {
                const token = generateAccessToken(id, email, role, newTeam.id, name);
                setTokenInResponse(res, token);
            }

            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async deleteTeam(req: Request, res: Response) {
        try {
            const { teamId } = req.params;
            const { email, role } = getTokenFromRequest(req);
            if (demoAdminRoles.has(role)) {
                const team = await this.teamRepository.findByIdWithRelations(teamId);
                if (team.captain?.email !== email) {
                    return res.status(403).json({ message: 'Демо-админ может удалить только команду с собой' });
                }
            }

            await this.teamRepository.deleteById(teamId);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async editTeam(req: Request, res: Response) {
        try {
            const { teamId } = req.params;
            const { newTeamName, captain, participants } = req.body;

            const currentTeam = await this.teamRepository.findById(teamId);
            if (!currentTeam) {
                return res.status(404).json({ message: 'Команда не найдена' });
            }

            const team = await this.teamRepository.findByName(newTeamName);
            if (team && team.id !== teamId) {
                return res.status(409).json({ message: 'Команда с таким названием уже есть' });
            }

            const {
                id,
                email,
                role,
                name,
                teamId: currentTeamId,
            } = getTokenFromRequest(req);

            if (userRoles.has(role)) {
                if (teamId !== currentTeamId) {
                    return res.status(403).json({ message: 'У пользователя нет прав' });
                }

                if (!captain) {
                    const token = generateAccessToken(id, email, role, null, name);
                    setTokenInResponse(res, token);
                }
            } else if (demoAdminRoles.has(role) && captain.toLowerCase() !== email.toLowerCase()) {
                return res.status(403).json({ message: 'Демо-админ может занять команду только собой' });
            }

            const mappedParticipants = participants?.map(value => new Participant(value.email, value.name)); // избавляемся от мусора в JSON
            await this.teamRepository.updateByParams(teamId, newTeamName, captain, mappedParticipants);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async editTeamCaptainByCurrentUser(req: Request, res: Response) {
        try {
            const { teamId } = req.params;

            const {
                id,
                email,
                role,
                name
            } = getTokenFromRequest(req);

            await this.teamRepository.updateEmptyTeamByIdAndUserId(teamId, id);

            const token = generateAccessToken(id, email, role, teamId, name);
            setTokenInResponse(res, token);

            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async getTeam(req: Request, res: Response) {
        try {
            const { teamId } = req.params;
            const team = await this.teamRepository.findByIdWithRelations(teamId);
            if (!team) {
                return res.status(404).json({ message: 'team not found' });
            }

            return res.status(200).json(new TeamDto(team));
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async getParticipants(req: Request, res: Response) {
        try {
            const { teamId } = req.params;
            const team = await this.teamRepository.findById(teamId);
            return res.status(200).json({
                participants: team.participants
            });

        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }
}