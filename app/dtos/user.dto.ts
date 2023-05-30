import { User } from '../db/entities/user';

export class UserDto {
    public readonly name: string | null;
    public readonly id: string;
    public readonly email: string | null;
    public readonly role = 'user';
    public readonly team: string;
    public readonly teamId: string;

    constructor(user: User) {
        this.name = user.name;
        this.id = user.id.toString();
        this.email = user.email;
        this.team = user.team?.name;
        this.teamId = user.team?.id;
    }
}