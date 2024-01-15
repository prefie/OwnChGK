import { GamePartSettings } from './type';
import { Status } from '../components/game-item/game-item.tsx';

type Request = RequestInit & { path: string };

export class ServerApi {
    private static serverPath = `/api`;

    private static Method = {
        POST: 'POST',
        PATCH: 'PATCH',
        DELETE: 'DELETE',
        GET: 'GET'
    };

    private static DefaultHeaders = {
        'Content-Type': 'application/json;charset=utf-8',
        Accept: 'application/json'
    };

    private static async sendRequest(request: Request) {
        const fullPath = this.serverPath + request.path;
        return await fetch(fullPath, {
            method: request.method ?? this.Method.GET,
            headers: request.body ? this.DefaultHeaders : {},
            body: request.body,
            credentials: 'include'
        });
    }

    public static async createGame(
        gameName: string,
        teams: string[],
        chgkSettings?: GamePartSettings,
        matrixSettings?: GamePartSettings,
        accessLevel: 'public' | 'private' = 'private'
    ) {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/games/',
            body: JSON.stringify({
                gameName,
                teams,
                chgkSettings,
                matrixSettings,
                accessLevel
            })
        });
    }

    public static async createUser(email: string, password: string) {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/users/insert',
            body: JSON.stringify({
                email,
                password
            })
        });
    }

    public static async login(email: string, password: string, isAdmin: boolean) {
        return this.sendRequest({
            method: this.Method.POST,
            path: `/${isAdmin ? 'admins' : 'users'}/login`,
            body: JSON.stringify({
                email,
                password
            })
        });
    }

    public static async logout() {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/users/logout'
        });
    }

    public static async addCurrentTeamInGame(gameId: string) {
        return this.sendRequest({
            method: this.Method.POST,
            path: `/games/${gameId}/team`
        });
    }

    public static async addTeamInGame(gameId: string, teamId: string) {
        return this.sendRequest({
            method: this.Method.POST,
            path: `/games/${gameId}/team`,
            body: JSON.stringify({
                teamId
            })
        });
    }

    public static async createTeam(
        teamName: string,
        captain?: string,
        participants?: {
            name: string;
            email: string;
        }[]
    ) {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/teams/',
            body: JSON.stringify({
                teamName,
                captain,
                participants
            })
        });
    }

    public static async sendTemporaryPassword(email: string, isAdmin: boolean) {
        return this.sendRequest({
            method: this.Method.POST,
            path: `/${isAdmin ? 'admins' : 'users'}/sendMail`,
            body: JSON.stringify({
                email
            })
        });
    }

    public static async checkTemporaryPassword(email: string, code: string, isAdmin: boolean) {
        return this.sendRequest({
            method: this.Method.POST,
            path: `/${isAdmin ? 'admins' : 'users'}/checkTemporaryPassword`,
            body: JSON.stringify({
                email,
                code
            })
        });
    }

    public static async deleteAdmin(adminEmail: string) {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/admins/delete',
            body: JSON.stringify({
                email: adminEmail
            })
        });
    }

    public static async addAdmin(adminEmail: string, adminName = '') {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/admins/insert',
            body: JSON.stringify({
                email: adminEmail,
                name: adminName
            })
        });
    }

    public static async insertDemoAdmin() {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/admins/demo'
        });
    }

    public static async insertDemoUser() {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/users/demo'
        });
    }

    public static async editGame(
        gameId: string,
        newGameName: string,
        chgkSettings?: GamePartSettings,
        matrixSettings?: GamePartSettings,
        accessLevel: 'public' | 'private' = 'private'
    ) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/games/${gameId}/change`,
            body: JSON.stringify({
                newGameName,
                chgkSettings,
                matrixSettings,
                accessLevel
            })
        });
    }

    public static async editTeam(
        teamId: string,
        newTeamName: string,
        captain?: string,
        participants?: { name: string; email: string }[]
    ) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/teams/${teamId}/change`,
            body: JSON.stringify({
                newTeamName,
                captain,
                participants
            })
        });
    }

    public static async editTeamCaptainByCurrentUser(teamId: string) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/teams/${teamId}/changeCaptain`
        });
    }

    public static async changePassword(email: string, password: string, oldPassword: string, isAdmin = false) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/${isAdmin ? 'admins' : 'users'}/changePassword`,
            body: JSON.stringify({
                email,
                password,
                oldPassword
            })
        });
    }

    public static async changePasswordByCode(email: string, password: string, code: string, isAdmin: boolean) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/${isAdmin ? 'admins' : 'users'}/changePasswordByCode`,
            body: JSON.stringify({
                email,
                password,
                code
            })
        });
    }

    public static async changeName(newName: string, isAdmin: boolean) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/${isAdmin ? 'admins' : 'users'}/changeName`,
            body: JSON.stringify({
                newName
            })
        });
    }

    public static async changeIntrigueGameStatus(gameId: string, isIntrigue: boolean) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/games/${gameId}/changeIntrigueStatus`,
            body: JSON.stringify({
                isIntrigue
            })
        });
    }

    public static async deleteCurrentTeamFromGame(gameId: string) {
        return this.sendRequest({
            method: this.Method.DELETE,
            path: `/games/${gameId}/team`
        });
    }

    public static async deleteTeamFromGame(gameId: string, teamId: string) {
        return this.sendRequest({
            method: this.Method.DELETE,
            path: `/games/${gameId}/team`,
            body: JSON.stringify({
                teamId
            })
        });
    }

    public static async deleteGame(gameId: string) {
        return this.sendRequest({
            method: this.Method.DELETE,
            path: `/games/${gameId}`
        });
    }

    public static async deleteTeam(teamId: string) {
        return this.sendRequest({
            method: this.Method.DELETE,
            path: `/teams/${teamId}`
        });
    }

    public static async getAll(path: string) {
        return this.sendRequest({
            path: `/${path}`
        });
    }

    public static async getAmIParticipateGames() {
        return this.sendRequest({
            path: '/games?amIParticipate=true'
        });
    }

    public static async getAmIParticipateAndPublicGames() {
        return this.sendRequest({
            path: '/games?amIParticipate=true&publicEnabled=true'
        });
    }

    public static async getTeamsParticipants(gameId: string) {
        return this.sendRequest({
            path: `/games/${gameId}/teamsParticipants`
        });
    }

    public static async getResultTable(gameId: string) {
        return this.sendRequest({
            path: `/games/${gameId}/resultTable`
        });
    }

    public static async getResultTableFormat(gameId: string) {
        return this.sendRequest({
            path: `/games/${gameId}/resultTable/format`
        });
    }

    public static async getTeamsParticipantTable(gameId: string) {
        return this.sendRequest({
            path: `/games/${gameId}/participants`
        });
    }

    public static async getUsersWithoutTeam() {
        return this.sendRequest({
            path: '/users?withoutTeam=true'
        });
    }

    public static async getGame(gameId: string) {
        return this.sendRequest({
            path: `/games/${gameId}`
        });
    }

    public static async startGame(gameId: string) {
        return this.sendRequest({
            path: `/games/${gameId}/start`
        });
    }

    public static async endGame(gameId: string) {
        return this.sendRequest({
            path: `/games/${gameId}/close`
        });
    }

    public static async getTeam(teamId: string) {
        return this.sendRequest({
            path: `/teams/${teamId}`
        });
    }

    public static async getTeamByCurrentUser() {
        return this.sendRequest({
            path: '/users/getTeam'
        });
    }

    public static async getTeamsWithoutUser() {
        return this.sendRequest({
            path: '/teams?withoutUser=true'
        });
    }

    public static async checkToken() {
        return this.sendRequest({
            path: '/users/current'
        });
    }
}
