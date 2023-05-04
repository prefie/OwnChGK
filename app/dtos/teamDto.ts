import {Participant, Team} from "../db/entities/Team";

export class TeamDto {
    public readonly name: string;
    public readonly id: string;
    public readonly captainEmail: string;
    public readonly captainId: string;
    public readonly participants: Participant[];
    public readonly participantsCount: number;

    constructor(team: Team) {
        this.name = team.name;
        this.id = team.id.toString();
        this.captainEmail = team.captain?.email; // TODO: мб на UserDto?
        this.captainId = team.captain?.id.toString();
        this.participants = team.participants;
        this.participantsCount = team.participants?.length ?? 0;
    }
}