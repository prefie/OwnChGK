export const getAll = async (path: string) => {
    return await fetch('/api' + path);
};

export const getAmIParticipateGames = async () => {
    return await fetch('/api/games/?amIParticipate=true');
};

export const getAmIParticipateAndPublicGames = async () => {
    return await fetch('/api/games/?amIParticipate=true&publicEnabled=true');
};

export const getTeamsParticipants = async (gameId: string) => {
    return await fetch(`/api/games/${gameId}/teamsParticipants`);
};

export const getResultTable = async (gameId: string) => {
    return await fetch(`/api/games/${gameId}/resultTable`);
};

export const getResultTableFormat = async (gameId: string) => {
    return await fetch(`/api/games/${gameId}/resultTable/format`);
};

export const getTeamsParticipantTable = async (gameId: string) => {
    return await fetch(`/api/games/${gameId}/participants`);
};

export const getUsersWithoutTeam = async () => {
    return await fetch(`/api/users/?withoutTeam=true`);
};

export const getGame = async (gameId: string) => {
    return await fetch(`/api/games/${gameId}`);
};

export interface GamePartSettings {
    roundsCount: number;
    questionsCount: number;
    questions?: Record<number, string[]> | undefined;
    roundNames?: string[];
}

export const createGame = async (
    gameName: string,
    teams: string[],
    chgkSettings?: GamePartSettings,
    matrixSettings?: GamePartSettings,
    accessLevel: 'public' | 'private' = 'private',
) => {
    return await fetch('/api/games/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            gameName,
            teams,
            chgkSettings,
            matrixSettings,
            accessLevel
        })
    });
};

export const createUser = async (email: string, password: string) => {
    return await fetch('/api/users/insert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            email,
            password
        })
    });
};

export const login = async (email: string, password: string, isAdmin: boolean) => {
    return await fetch(isAdmin ? '/api/admins/login' : '/api/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            email,
            password
        })
    });
};

export const logout = async () => {
    return await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        }
    });
};

export const startGame = async (gameId: string) => {
    return fetch(`/api/games/${gameId}/start`);
};

export const editGame = async (
    gameId: string,
    newGameName: string,
    chgkSettings?: GamePartSettings,
    matrixSettings?: GamePartSettings,
    accessLevel: 'public' | 'private' = 'private',
) => {
    return await fetch(`/api/games/${gameId}/change`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            newGameName,
            chgkSettings,
            matrixSettings,
            accessLevel
        })
    });
};

export const addCurrentTeamInGame = async (gameId: string) => {
    return await fetch(`/api/games/${gameId}/team`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
    });
};

export const addTeamInGame = async (gameId: string, teamId: string) => {
    return await fetch(`/api/games/${gameId}/team`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            teamId
        })
    });
};

export const deleteCurrentTeamFromGame = async (gameId: string) => {
    return await fetch(`/api/games/${gameId}/team`, {
        method: 'DELETE'
    });
};

export const deleteTeamFromGame = async (gameId: string, teamId: string) => {
    return await fetch(`/api/games/${gameId}/team`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            teamId
        })
    });
};

export const deleteGame = async (gameId: string) => {
    return await fetch(`/api/games/${gameId}`, {
        method: 'DELETE'
    });
};

export const deleteTeam = async (teamId: string) => {
    return await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE'
    });
};

export const getTeam = async (teamId: string) => {
    return await fetch(`/api/teams/${teamId}`);
};

export const createTeam = async (teamName: string, captain?: string, participants?: { name: string, email: string }[]) => {
    return await fetch('/api/teams/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            teamName,
            captain,
            participants,
        })
    });
};

export const editTeam = async (teamId: string, newTeamName: string, captain?: string, participants?: { name: string, email: string }[]) => {
    return await fetch(`/api/teams/${teamId}/change`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            newTeamName,
            captain,
            participants,
        })
    });
};

export const editTeamCaptainByCurrentUser = async (teamId: string) => {
    return await fetch(`/api/teams/${teamId}/changeCaptain`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        }
    });
};

export const getTeamByCurrentUser = async () => {
    return await fetch('/api/users/getTeam');
};

export const getTeamsWithoutUser = async () => {
    return await fetch(`/api/teams/?withoutUser=true`);
};

export const checkToken = async () => {
    return await fetch('/api/users/current');
};

export const sendTemporaryPassword = async (email: string, isAdmin: boolean) => {
    return await fetch(`/api/${isAdmin ? 'admins' : 'users'}/sendMail`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            email
        })
    });
};

export const checkTemporaryPassword = async (email: string, code: string, isAdmin: boolean) => {
    return await fetch(`/api/${isAdmin ? 'admins' : 'users'}/checkTemporaryPassword`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            email,
            code
        })
    });
};

export const changePassword = async (email: string, password: string, oldPassword: string, isAdmin = false) => {
    return await fetch(`/api/${isAdmin ? 'admins' : 'users'}/changePassword`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            email,
            password,
            oldPassword
        })
    });
};

export const changePasswordByCode = async (email: string, password: string, code: string, isAdmin: boolean) => {
    return await fetch(`/api/${isAdmin ? 'admins' : 'users'}/changePasswordByCode`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            email,
            password,
            code
        })
    });
};

export const changeName = async (newName: string, isAdmin: boolean) => {
    return await fetch(`/api/${isAdmin ? 'admins' : 'users'}/changeName`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            newName
        })
    });
};

export const changeIntrigueGameStatus = async (gameId: string, isIntrigue: boolean) => {
    return await fetch(`/api/games/${gameId}/changeIntrigueStatus`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            isIntrigue
        })
    });
};

export const deleteAdmin = async (adminEmail: string) => {
    return await fetch(`/api/admins/delete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            email: adminEmail
        })
    });
};

export const addAdmin = async (adminEmail: string, adminName = '') => {
    return await fetch(`/api/admins/insert`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            email: adminEmail,
            name: adminName
        })
    });
};

export const insertDemoAdmin = async () => {
    return await fetch(`/api/admins/demo`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
    });
};

export const insertDemoUser = async () => {
    return await fetch(`/api/users/demo`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
        credentials: 'include',
    });
};

export enum AnswerStatus {
    RIGHT = 'right',
    WRONG = 'wrong',
    UNCHECKED = 'unchecked',
    ON_APPEAL = 'on_appeal'
}
