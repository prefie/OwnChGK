import { GamePartSettings } from './type';

export class ServerApi {
    private static pathServer = 'http://localhost:3001/';

    private static Method = {
        POST: 'POST',
        PATCH: 'PATCH',
        DELETE: 'DELETE',
    };

    private static async sendRequest({
        method,
        path,
        body,
        methodOnly = false,
        sendOnly = false,
    }: {
        method?: string;
        path: string;
        body?: BodyInit;
        methodOnly?: boolean;
        sendOnly?: boolean;
    }) {
        const fullPath = this.pathServer + path;
        if (sendOnly) {
            return await fetch(fullPath);
        }
        if (methodOnly) {
            return await fetch(fullPath, {
                method: method,
            });
        }
        if (body) {
            return await fetch(fullPath, {
                method: method,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    Accept: 'application/json',
                },
                credentials: 'include',
                body: body,
            });
        }
        return await fetch(fullPath, {
            method: method,
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                Accept: 'application/json',
            },
            credentials: 'include',
        });
    }

    public static async createGame(
        gameName: string,
        teams: string[],
        chgkSettings?: GamePartSettings,
        matrixSettings?: GamePartSettings,
        accessLevel: 'public' | 'private' = 'private',
    ) {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/api/games/',
            body: JSON.stringify({
                gameName,
                teams,
                chgkSettings,
                matrixSettings,
                accessLevel,
            }),
        });
    }

    public static async createUser(email: string, password: string) {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/api/users/insert',
            body: JSON.stringify({
                email,
                password,
            }),
        });
    }

    public static async login(email: string, password: string, isAdmin: boolean) {
        return this.sendRequest({
            method: this.Method.POST,
            path: `/api/${isAdmin ? 'admins' : 'users'}/login`,
            body: JSON.stringify({
                email,
                password,
            }),
        });
    }

    public static async logout() {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/api/users/logout',
        });
    }

    public static async addCurrentTeamInGame(gameId: string) {
        return this.sendRequest({
            method: this.Method.POST,
            path: `/api/games/${gameId}/team`,
        });
    }

    public static async addTeamInGame(gameId: string, teamId: string) {
        return this.sendRequest({
            method: this.Method.POST,
            path: `/api/games/${gameId}/team`,
            body: JSON.stringify({
                teamId,
            }),
        });
    }

    public static async createTeam(
        teamName: string,
        captain?: string,
        participants?: {
            name: string;
            email: string;
        }[],
    ) {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/api/teams/',
            body: JSON.stringify({
                teamName,
                captain,
                participants,
            }),
        });
    }

    public static async sendTemporaryPassword(email: string, isAdmin: boolean) {
        return this.sendRequest({
            method: this.Method.POST,
            path: `/api/${isAdmin ? 'admins' : 'users'}/sendMail`,
            body: JSON.stringify({
                email,
            }),
        });
    }

    public static async checkTemporaryPassword(email: string, code: string, isAdmin: boolean) {
        return this.sendRequest({
            method: this.Method.POST,
            path: `/api/${isAdmin ? 'admins' : 'users'}/checkTemporaryPassword`,
            body: JSON.stringify({
                email,
                code,
            }),
        });
    }

    public static async deleteAdmin(adminEmail: string) {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/api/admins/delete',
            body: JSON.stringify({
                email: adminEmail,
            }),
        });
    }

    public static async addAdmin(adminEmail: string, adminName = '') {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/api/admins/insert',
            body: JSON.stringify({
                email: adminEmail,
                name: adminName,
            }),
        });
    }

    public static async insertDemoAdmin() {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/api/admins/demo',
        });
    }

    public static async insertDemoUser() {
        return this.sendRequest({
            method: this.Method.POST,
            path: '/api/users/demo',
        });
    }

    public static async editGame(
        gameId: string,
        newGameName: string,
        chgkSettings?: GamePartSettings,
        matrixSettings?: GamePartSettings,
        accessLevel: 'public' | 'private' = 'private',
    ) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/api/games/${gameId}/change`,
            body: JSON.stringify({
                newGameName,
                chgkSettings,
                matrixSettings,
                accessLevel,
            }),
        });
    }

    public static async editTeam(
        teamId: string,
        newTeamName: string,
        captain?: string,
        participants?: { name: string; email: string }[],
    ) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/api/teams/${teamId}/change`,
            body: JSON.stringify({
                newTeamName,
                captain,
                participants,
            }),
        });
    }

    public static async editTeamCaptainByCurrentUser(teamId: string) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/api/teams/${teamId}/changeCaptain`,
        });
    }

    public static async changePassword(email: string, password: string, oldPassword: string, isAdmin = false) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/api/${isAdmin ? 'admins' : 'users'}/changePassword`,
            body: JSON.stringify({
                email,
                password,
                oldPassword,
            }),
        });
    }

    public static async changePasswordByCode(email: string, password: string, code: string, isAdmin: boolean) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/api/${isAdmin ? 'admins' : 'users'}/changePasswordByCode`,
            body: JSON.stringify({
                email,
                password,
                code,
            }),
        });
    }

    public static async changeName(newName: string, isAdmin: boolean) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/api/${isAdmin ? 'admins' : 'users'}/changeName`,
            body: JSON.stringify({
                newName,
            }),
        });
    }

    public static async changeIntrigueGameStatus(gameId: string, isIntrigue: boolean) {
        return this.sendRequest({
            method: this.Method.PATCH,
            path: `/api/games/${gameId}/changeIntrigueStatus`,
            body: JSON.stringify({
                isIntrigue,
            }),
        });
    }

    public static async deleteCurrentTeamFromGame(gameId: string) {
        return this.sendRequest({
            method: this.Method.DELETE,
            path: `/api/games/${gameId}/team`,
            methodOnly: true,
        });
    }

    public static async deleteTeamFromGame(gameId: string, teamId: string) {
        return this.sendRequest({
            method: this.Method.DELETE,
            path: `/api/games/${gameId}/team`,
            body: JSON.stringify({
                teamId,
            }),
        });
    }

    public static async deleteGame(gameId: string) {
        return this.sendRequest({
            method: this.Method.DELETE,
            path: `/api/games/${gameId}`,
            methodOnly: true,
        });
    }

    public static async deleteTeam(teamId: string) {
        return this.sendRequest({
            method: this.Method.DELETE,
            path: `/api/teams/${teamId}`,
            methodOnly: true,
        });
    }

    public static async getAll(path: string) {
        return this.sendRequest({
            path: `/api/${path}`,
            sendOnly: true,
        });
    }

    public static async getAmIParticipateGames() {
        return this.sendRequest({
            path: '/api/games/?amIParticipate=true',
            sendOnly: true,
        });
    }

    public static async getAmIParticipateAndPublicGames() {
        return this.sendRequest({
            path: '/api/games/?amIParticipate=true&publicEnabled=true',
            sendOnly: true,
        });
    }

    public static async getTeamsParticipants(gameId: string) {
        return this.sendRequest({
            path: `/api/games/${gameId}/teamsParticipants`,
            sendOnly: true,
        });
    }

    public static async getResultTable(gameId: string) {
        return this.sendRequest({
            path: `/api/games/${gameId}/resultTable`,
            sendOnly: true,
        });
    }

    public static async getResultTableFormat(gameId: string) {
        return this.sendRequest({
            path: `/api/games/${gameId}/resultTable/format`,
            sendOnly: true,
        });
    }

    public static async getTeamsParticipantTable(gameId: string) {
        return this.sendRequest({
            path: `/api/games/${gameId}/participants`,
            sendOnly: true,
        });
    }

    public static async getUsersWithoutTeam() {
        return this.sendRequest({
            path: '/api/users/?withoutTeam=true',
            sendOnly: true,
        });
    }

    public static async getGame(gameId: string) {
        return this.sendRequest({
            path: `/api/games/${gameId}`,
            sendOnly: true,
        });
    }

    public static async startGame(gameId: string) {
        return this.sendRequest({
            path: `/api/games/${gameId}/start`,
            sendOnly: true,
        });
    }

    public static async endGame(gameId: string) {
        return this.sendRequest({
            path: `/api/games/${gameId}/end`,
            sendOnly: true,
        });
    }

    public static async getTeam(teamId: string) {
        return this.sendRequest({
            path: `/api/teams/${teamId}`,
            sendOnly: true,
        });
    }

    public static async getTeamByCurrentUser() {
        return this.sendRequest({
            path: '/api/users/getTeam',
            sendOnly: true,
        });
    }

    public static async getTeamsWithoutUser() {
        return this.sendRequest({
            path: '/api/teams/?withoutUser=true',
            sendOnly: true,
        });
    }

    public static async checkToken() {
        return this.sendRequest({
            path: '/api/users/current',
            sendOnly: true,
        });
    }
}