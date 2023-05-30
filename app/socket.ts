import { getTokenFromString } from './utils/jwt-token';
import { WebSocket } from 'ws';
import { BigGameLogic } from './logic/big-game-logic';
import { allAdminRoles, userRoles } from './utils/roles';
import { GameTypeLogic } from './logic/enums/game-type-logic.enum';
import { GameStatus } from './logic/enums/game-status.enum';
import { AnswerStatus } from './db/entities/answer';
import { AppealStatus } from './db/entities/appeal';

export const bigGames: Record<string, BigGameLogic> = {};
export const gameAdmins: Record<string, Set<WebSocket>> = {};
export const gameUsers: Record<string, Set<WebSocket>> = {};
export const seconds70PerQuestion = 70000;
export const seconds20PerQuestion = 20000;
export const extra10Seconds = 10000;

function GiveAddedTime(gameId: string, gamePart: GameTypeLogic) {
    const game = gamePart == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    if (!game) return;

    if (game.timeIsOnPause) {
        game.leftTime += extra10Seconds;
        game.maxTime += extra10Seconds;
        for (let user of gameUsers[gameId]) {
            user.send(JSON.stringify({
                'action': 'addTime',
                'maxTime': game.maxTime,
                'time': game.leftTime,
                'isStarted': false,
            }));
        }
    } else {
        if (!game.timerStarted) {
            game.leftTime += extra10Seconds;
            game.maxTime += extra10Seconds;
            for (let user of gameUsers[gameId]) {
                user.send(JSON.stringify({
                    'action': 'addTime',
                    'maxTime': game.maxTime,
                    'time': game.leftTime,
                    'isStarted': false,
                }));
            }
        } else {
            const pastDelay = Math.floor(process.uptime() * 1000 - game.timer._idleStart);
            const initialDelay = game.timer._idleTimeout;
            clearTimeout(game.timer);
            game.timerStarted = true;
            if (initialDelay - pastDelay < 0) {
                game.leftTime = extra10Seconds;
            } else game.leftTime = initialDelay - pastDelay + extra10Seconds;
            game.maxTime += extra10Seconds;
            game.timer = setTimeout(() => {
                game.timerStarted = false;
                game.leftTime = 0;
            }, game.leftTime);
            for (let user of gameUsers[gameId]) {
                user.send(JSON.stringify({
                    'action': 'addTime',
                    'maxTime': game.maxTime,
                    'time': game.leftTime,
                    'isStarted': true,
                }));
            }
        }
    }
}

function ChangeQuestionNumber(gameId: string, questionNumber: number, tourNumber: number, activeGamePart: GameTypeLogic) {
    const currentGame = activeGamePart == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    bigGames[gameId].currentGame = currentGame
    if (currentGame) {
        currentGame.currentQuestion = [tourNumber, questionNumber];

        for (let user of gameUsers[gameId]) {
            user.send(JSON.stringify({
                'action': 'changeQuestionNumber',
                'matrixActive': { round: tourNumber, question: questionNumber },
                'number': currentGame.rounds[0].questionsCount * (tourNumber - 1) + questionNumber,
                'text': currentGame.rounds[tourNumber - 1].questions[questionNumber - 1]?.text,
                'activeGamePart': activeGamePart
            }));
        }
    }
}

function StartTimer(gameId: string, gamePart: GameTypeLogic) {
    const game = gamePart == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    if (game && !game.timeIsOnPause) {
        game.timerStarted = true;
        game.timer = setTimeout(() => {
            game.timerStarted = false;
            game.leftTime = 0;
        }, game.leftTime);

        for (let user of gameUsers[gameId]) {
            user.send(JSON.stringify({
                'action': 'start',
                'maxTime': game.maxTime,
                'time': game.leftTime
            }));
        }
    } else if (game) {
        game.timerStarted = true;
        game.timeIsOnPause = false;
        game.timer = setTimeout(() => {
            game.timerStarted = false;
            game.leftTime = 0;
        }, game.leftTime);
        for (let user of gameUsers[gameId]) {
            user.send(JSON.stringify({
                'action': 'start',
                'maxTime': game.maxTime,
                'time': game.leftTime
            }));
        }
    }
}

function StopTimer(gameId: string, gamePart: GameTypeLogic) {
    const game = gamePart == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    if (!game) return;

    game.timerStarted = false;
    clearTimeout(game.timer);
    game.timeIsOnPause = false;
    game.leftTime = game.type == GameTypeLogic.ChGK
        ? seconds70PerQuestion
        : seconds20PerQuestion;
    game.maxTime = game.type == GameTypeLogic.ChGK
        ? seconds70PerQuestion
        : seconds20PerQuestion;
    for (let user of gameUsers[gameId]) {
        user.send(JSON.stringify({
            'action': 'stop',
            'activeGamePart': game.type,
        }));
    }
}

function PauseTimer(gameId: string, gamePart: GameTypeLogic) {
    const game = gamePart == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    if (game && game.timerStarted) {
        game.timerStarted = false;
        game.timeIsOnPause = true;
        game.leftTime -= Math.floor(process.uptime() * 1000 - game.timer._idleStart);
        clearTimeout(game.timer);

        for (let user of gameUsers[gameId]) {
            user.send(JSON.stringify({
                'action': 'pause'
            }));
        }
    }
}

function GiveAnswer(answer: string, teamId: string, gameId: string, ws: WebSocket) {
    const roundNumber = bigGames[gameId].currentGame?.currentQuestion?.[0] ?? 0 - 1;
    const questionNumber = bigGames[gameId].currentGame?.currentQuestion?.[1] ?? 0 - 1;
    const currentGame = bigGames[gameId].currentGame;
    if (currentGame) {
        currentGame.rounds[roundNumber].questions[questionNumber]
            .giveAnswer(currentGame.teams[teamId], answer);

        ws.send(JSON.stringify({
            'action': 'statusAnswer',
            'isAccepted': true,
            'answer': answer,
            'activeGamePart': GameTypeLogic.ChGK
        }));
    }
}

function GiveAppeal(appeal: string, teamId: string, gameId: string, number: number, answer: string, gamePart: GameTypeLogic) {
    const game = gamePart == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    if (!game) return;

    const roundNumber = Math.ceil(number / game.rounds[0].questionsCount);
    let questionNumber = number - (roundNumber - 1) * game.rounds[0].questionsCount;
    game.rounds[roundNumber - 1].questions[questionNumber - 1].giveAppeal(teamId, appeal, answer);
}

function AcceptAnswer(gameId: string, gameType: GameTypeLogic, roundNumber: number, questionNumber: number, answers: string[]) {
    const game = gameType == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    if (!game) return;

    for (const answer of answers) {
        game.rounds[roundNumber - 1].questions[questionNumber - 1].acceptAnswers(answer);
    }
}

function ChangeAnswer(gameId: string, gameType: GameTypeLogic, teamId: string, number: number) {
    const game = gameType == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    if (!game) return;
    const roundNumber = Math.ceil(number / game.rounds[0].questionsCount);
    let questionNumber = number - (roundNumber - 1) * game.rounds[0].questionsCount;
    game.rounds[roundNumber - 1].questions[questionNumber - 1]
        .changeAnswer(game.teams[teamId], gameType == GameTypeLogic.Matrix);
}

function AcceptAppeal(gameId: string, gameType: GameTypeLogic, roundNumber: number, questionNumber: number, answers: string[]) {
    const game = gameType == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    for (const answer of answers) {
        game?.rounds[roundNumber - 1].questions[questionNumber - 1].acceptAppeal(answer, '');
    }
}

function RejectAppeal(gameId: string, gameType: GameTypeLogic, roundNumber: number, questionNumber: number, answers: string[]) {
    const game = gameType == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    if (!game) return;

    for (const answer of answers) {
        game.rounds[roundNumber - 1].questions[questionNumber - 1].rejectAppeal(answer, '');
    }
}

function RejectAnswer(gameId: string, gameType: GameTypeLogic, roundNumber: number, questionNumber: number, answers: string[], isMatrixType = false) {
    const game = gameType == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    if (!game) return;

    for (const answer of answers) {
        game.rounds[roundNumber - 1].questions[questionNumber - 1].rejectAnswers(answer, isMatrixType);
    }
}

function GetAllTeamsAnswers(gameId: string, gameType: GameTypeLogic, roundNumber: number, questionNumber: number, ws: WebSocket) {
    const game = gameType == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    if (!game) return;

    const answers = game.rounds[roundNumber - 1].questions[questionNumber - 1].answers.filter(ans => ans.text.length > 0);
    const acceptedAnswers = answers
        .filter(ans => ans.status == AnswerStatus.RIGHT)
        .map(ans => ans.text);
    const rejectedAnswers = answers
        .filter(ans => ans.status == AnswerStatus.WRONG || ans.status == AnswerStatus.ON_APPEAL)
        .map(ans => ans.text);
    const uncheckedAnswers = answers
        .filter(ans => ans.status == AnswerStatus.UNCHECKED)
        .map(ans => ans.text);
    ws.send(JSON.stringify({
        'action': 'answers',
        'acceptedAnswers': acceptedAnswers,
        'rejectedAnswers': rejectedAnswers,
        'uncheckedAnswers': uncheckedAnswers
    }));
}

function GetAppealsByNumber(gameId: string, gameType: GameTypeLogic, roundNumber: number, questionNumber: number, ws: WebSocket) {
    const game = gameType == GameTypeLogic.ChGK ? bigGames[gameId].chGKGame : bigGames[gameId].matrixGame;
    if (!game) return;

    const appeals = game.rounds[roundNumber - 1].questions[questionNumber - 1].appeals
        .filter(appeal => appeal.status == AppealStatus.UNCHECKED)
        .map(appeal => {
            return {
                teamName: game.teams[appeal.teamId].name,
                text: appeal.text,
                answer: game.teams[appeal.teamId].getAnswer(roundNumber, questionNumber)?.text
            };
        });

    ws.send(JSON.stringify({
        'action': 'appealsByNumber',
        appeals
    }));
}

function GetAllAppeals(gameId: string, ws: WebSocket) { // Тут вроде CurrentGame законно: метод нужен для индикации апелляций в текущей игре
    const res = [];
    const currentGame = bigGames[gameId].currentGame;
    if (!currentGame) return;

    for (let roundNumber = 0; roundNumber < currentGame.getRoundsCount(); roundNumber++) {
        for (let questionNumber = 0; questionNumber < currentGame.rounds[roundNumber].questions.length; questionNumber++) {
            if (currentGame.rounds[roundNumber].questions[questionNumber].appeals
                .filter(a => a.status == AppealStatus.UNCHECKED).length > 0)
                res.push(roundNumber * currentGame.rounds[roundNumber].questions.length + (questionNumber + 1));
        }
    }
    ws.send(JSON.stringify({
        action: 'appeals',
        appealByQuestionNumber: res
    }));
}

function GiveAnswerMatrix(answer: string, roundNumber: number, questionNumber: number, roundName: string, teamId: string, gameId: string, ws: WebSocket) {
    const matrix = bigGames[gameId].matrixGame;
    if (!matrix) return;

    matrix.rounds[roundNumber - 1].questions[questionNumber - 1]
        .giveAnswer(matrix.teams[teamId], answer);
    ws.send(JSON.stringify({
        'action': 'statusAnswer',
        'isAccepted': true,
        'roundNumber': roundNumber,
        'questionNumber': questionNumber,
        'roundName': roundName,
        'answer': answer,
        'activeGamePart': GameTypeLogic.Matrix
    }));
}

function StartBreakTime(gameId: string, time: number) {
    bigGames[gameId].startBreak(time);
    for (const adminWs of gameAdmins[gameId]) {
        adminWs.send(JSON.stringify({
            action: 'isOnBreak',
            status: true,
            time: time
        }));
    }
    for (const userWs of gameUsers[gameId]) {
        userWs.send(JSON.stringify({
            action: 'isOnBreak',
            status: true,
            time: time
        }));
    }
}

function StopBreakTime(gameId: string) {
    bigGames[gameId].stopBreak();
    for (const userWs of gameUsers[gameId]) {
        userWs.send(JSON.stringify({
            action: 'isOnBreak',
            status: false,
            time: 0
        }));
    }
}

function GetQuestionNumber(gameId: string, ws: WebSocket) {
    if (!bigGames[gameId].currentGame?.currentQuestion) {
        ws.send(JSON.stringify({
            'action': 'questionNumberIsUndefined',
            'activeGamePart': bigGames[gameId].currentGame?.type,
        }));
        return;
    }

    ws.send(JSON.stringify({
        'action': 'changeQuestionNumber',
        'round': bigGames[gameId].currentGame?.currentQuestion?.[0],
        'question': bigGames[gameId].currentGame?.currentQuestion?.[1],
        'activeGamePart': bigGames[gameId].currentGame?.type,
    }));
}

function GetTeamAnswers(gameId: string, teamId: string, ws: WebSocket) {
    let answer: { [key: string]: { number: number, answer: string, status: AnswerStatus }[] };
    answer = {};
    const chgkGame = bigGames[gameId].chGKGame;
    const matrixGame = bigGames[gameId].matrixGame;
    if (chgkGame) {
        const chgk = chgkGame.teams[teamId].getAnswers();
        answer['chgk'] = chgk.map((ans) => {
            return {
                number: (ans.roundNumber - 1) * chgkGame.rounds[0].questionsCount + ans.questionNumber,
                roundNumber: ans.roundNumber,
                questionNumber: ans.questionNumber,
                answer: ans.text,
                status: ans.status
            };
        });
    }
    if (matrixGame) {
        const matrix = matrixGame.teams[teamId].getAnswers();

        answer['matrix'] = matrix.map((ans) => {
            return {
                number: (ans.roundNumber - 1) * matrixGame.rounds[0].questionsCount + ans.questionNumber,
                roundNumber: ans.roundNumber,
                questionNumber: ans.questionNumber,
                answer: ans.text,
                status: ans.status
            };
        });

    }

    ws.send(JSON.stringify({
        'action': 'teamAnswers',
        'chgkAnswers': answer['chgk'],
        'matrixAnswers': answer['matrix']
    }));
}

function GetTeamAnswersForAdmin(gameId: string, teamId: string, ws: WebSocket) {
    let answer: { [key: string]: { number: number, answer: string, status: AnswerStatus }[] };
    answer = {};
    const chgkGame = bigGames[gameId].chGKGame;
    const matrixGame = bigGames[gameId].matrixGame;
    if (chgkGame) {
        const chgk = chgkGame.teams[teamId].getAnswers();
        answer['chgk'] = chgk.map((ans) => {
            return {
                number: (ans.roundNumber - 1) * chgkGame.rounds[0].questionsCount + ans.questionNumber,
                roundNumber: ans.roundNumber,
                questionNumber: ans.questionNumber,
                answer: ans.text,
                status: ans.status
            };
        });
    }
    if (matrixGame) {
        const matrix = matrixGame.teams[teamId].getAnswers();
        answer['matrix'] = matrix?.map((ans) => {
            return {
                number: (ans.roundNumber - 1) * matrixGame.rounds[0].questionsCount + ans.questionNumber,
                roundNumber: ans.roundNumber,
                questionNumber: ans.questionNumber,
                answer: ans.text,
                status: ans.status
            };
        });

    }

    const chgk = bigGames[gameId].chGKGame;
    const matrix = bigGames[gameId].matrixGame;
    ws.send(JSON.stringify({
        'action': 'teamAnswersForAdmin',
        'chgkAnswers': answer['chgk'],
        'matrixAnswers': answer['matrix'],
        'chgkQuestionsCount': chgk
            ? chgk.getRoundsCount() * chgk.rounds[0].questionsCount
            : 0,
        'matrixQuestionsCount': matrix
            ? matrix.getRoundsCount() * matrix.rounds[0].questionsCount
            : 0,
    }));
}

function NotifyAdminsAboutAppeal(gameId: string, number: number) {
    for (let ws of gameAdmins[gameId])
        ws.send(JSON.stringify({
            action: 'appeal',
            questionNumber: number
        }));
}

function AdminsAction(gameId: string, ws: WebSocket, jsonMessage: any, gameType: string) {
    if (!gameAdmins[gameId].has(ws)) {
        gameAdmins[gameId].add(ws);
        ws.on('close', function () {
            gameAdmins[gameId].delete(ws);
        });
    }

    switch (jsonMessage.action) {
        case '+10sec':
            GiveAddedTime(gameId, jsonMessage.gamePart);
            break;
        case 'Start':
            StartTimer(gameId, jsonMessage.gamePart);
            break;
        case 'Pause':
            PauseTimer(gameId, jsonMessage.gamePart);
            break;
        case 'Stop':
            StopTimer(gameId, jsonMessage.gamePart);
            break;
        case 'AcceptAnswer':
            AcceptAnswer(gameId, jsonMessage.gamePart, jsonMessage.roundNumber, jsonMessage.questionNumber, jsonMessage.answers);
            break;
        case 'AcceptAppeals':
            AcceptAppeal(gameId, jsonMessage.gamePart, jsonMessage.roundNumber, jsonMessage.questionNumber, jsonMessage.appeals);
            break;
        case 'RejectAnswer':
            RejectAnswer(gameId, jsonMessage.gamePart, jsonMessage.roundNumber, jsonMessage.questionNumber, jsonMessage.answers, gameType == GameTypeLogic.Matrix);
            break;
        case 'RejectAppeals':
            RejectAppeal(gameId, jsonMessage.gamePart, jsonMessage.roundNumber, jsonMessage.questionNumber, jsonMessage.appeals);
            break;
        case 'getAnswers':
            GetAllTeamsAnswers(gameId, jsonMessage.gamePart, jsonMessage.roundNumber, jsonMessage.questionNumber, ws);
            break;
        case 'getAppealsByNumber':
            GetAppealsByNumber(gameId, jsonMessage.gamePart, jsonMessage.roundNumber, jsonMessage.questionNumber, ws);
            break;
        case 'getAllAppeals':
            GetAllAppeals(gameId, ws);
            break;
        case 'breakTime':
            StartBreakTime(gameId, jsonMessage.time);
            break;
        case 'stopBreak':
            StopBreakTime(gameId);
            break;
        case 'changeQuestion':
            ChangeQuestionNumber(gameId, jsonMessage.questionNumber, jsonMessage.tourNumber, jsonMessage.activeGamePart);
            break;
        case 'getQuestionNumber':
            GetQuestionNumber(gameId, ws);
            break;
        case 'getTeamAnswersForAdmin':
            GetTeamAnswersForAdmin(gameId, jsonMessage.teamId, ws);
            break;
        case 'changeAnswer':
            ChangeAnswer(gameId, jsonMessage.gamePart, jsonMessage.teamId, jsonMessage.number);
            break;
    }
}

function UsersAction(gameId: string, ws: WebSocket, jsonMessage: any, gameType: string, teamId: string) {
    if (!bigGames[gameId].currentGame) {
        ws.send(JSON.stringify({
            'action': 'error',
            'gameIsStarted': bigGames[gameId].currentGame
        }));
        return;
    }
    if (!gameUsers[gameId].has(ws)) {
        gameUsers[gameId].add(ws);
        ws.on('close', function () {
            gameUsers[gameId].delete(ws);
        });
    }
    switch (jsonMessage.action) {
        case 'Answer':
            if (gameType == GameTypeLogic.ChGK && bigGames[gameId].currentGame?.timerStarted) {
                GiveAnswer(jsonMessage.answer, teamId, gameId, ws);
            } else if (gameType == GameTypeLogic.Matrix) {
                GiveAnswerMatrix(jsonMessage.answer, jsonMessage.roundNumber, jsonMessage.questionNumber, jsonMessage.roundName, teamId, gameId, ws);
            }
            break;
        case 'appeal':
            GiveAppeal(jsonMessage.appeal, teamId, gameId, jsonMessage.number, jsonMessage.answer, jsonMessage.gamePart);
            NotifyAdminsAboutAppeal(gameId, jsonMessage.number);
            break;
        case 'getTeamAnswers':
            GetTeamAnswers(gameId, teamId, ws);
            break;
    }
}

function GetPreliminaryTime(gameId: string) {
    if (bigGames[gameId].currentGame?.timer) {
        const pastDelay = Math.floor(process.uptime() * 1000 - bigGames[gameId].currentGame?.timer._idleStart);
        const initialDelay = bigGames[gameId].currentGame?.timer._idleTimeout;
        if (bigGames[gameId].currentGame?.timerStarted) {
            return initialDelay - pastDelay;
        } else {
            return bigGames[gameId].currentGame?.leftTime;
        }
    }

    return bigGames[gameId].currentGame?.leftTime;
}

function GetTime(gameId: string, ws: WebSocket) {
    ws.send(JSON.stringify({
        'action': 'time',
        'isStarted': bigGames[gameId].currentGame?.timerStarted,
        'maxTime': bigGames[gameId].currentGame?.maxTime,
        'time': GetPreliminaryTime(gameId),
        'gamePart': bigGames[gameId].currentGame?.type
    }));
}

function CheckTime(gameId: string, ws: WebSocket) {
    ws.send(JSON.stringify({
        'action': 'checkTime',
        'maxTime': bigGames[gameId].currentGame?.maxTime,
        'time': GetPreliminaryTime(gameId),
        'gamePart': bigGames[gameId].currentGame?.type
    }));
}

function CheckBreakTime(gameId: string, ws: WebSocket, time: number) {
    ws.send(JSON.stringify({
        'action': 'checkBreakTime',
        'currentTime': time,
        'time': bigGames[gameId].breakTime
    }));
}

function IsOnBreak(gameId: string, ws: WebSocket) {
    ws.send(JSON.stringify({
        action: 'isOnBreak',
        status: bigGames[gameId].status == GameStatus.IsOnBreak,
        time: bigGames[gameId].breakTime
    }));
}

function GetGameStatus(gameId: string, ws: WebSocket) {
    const currentGame = bigGames[gameId]?.currentGame;

    if (currentGame) {
        const currentRound = currentGame.currentQuestion ? currentGame.currentQuestion[0] : 0;
        const currentQuestion = currentGame.currentQuestion ? currentGame.currentQuestion[1] : 0;
        const currentQuestionNumber = currentGame.currentQuestion
            ? currentGame.rounds[0].questionsCount * (currentRound - 1) + currentQuestion
            : undefined;

        ws.send(JSON.stringify({
            'action': 'gameStatus',
            'isStarted': !!bigGames[gameId] && bigGames[gameId].currentGame?.currentQuestion,
            'activeGamePart': currentGame.type,
            'isOnBreak': bigGames[gameId].status == GameStatus.IsOnBreak,
            'breakTime': bigGames[gameId].breakTime,
            'currentQuestionNumber': currentQuestionNumber, //todo: тут вроде надо ток для чгк
            'matrixActive': currentGame.type == GameTypeLogic.Matrix && currentGame.currentQuestion ? {
                round: currentRound,
                question: currentQuestion
            } : null,
            'text': currentGame.rounds[currentRound - 1]?.questions[currentQuestion - 1]?.text,
            'maxTime': currentGame.maxTime,
            'time': GetPreliminaryTime(gameId),
        }));
    }
}

function GetNotAuthorizeMessage(ws: WebSocket) {
    ws.send(JSON.stringify({ 'action': 'notAuthorized' }));
}

export function HandlerWebsocket(ws: WebSocket, message: string) {
    message += '';
    const jsonMessage = JSON.parse(message);
    if (jsonMessage.action == 'ping') {
        ws.send(JSON.stringify({ 'action': 'pong' }));
        return;
    }

    if (!jsonMessage || !jsonMessage.cookie || !jsonMessage.gameId) {
        GetNotAuthorizeMessage(ws);
    } else {
        const { role: userRole, teamId: teamId } = getTokenFromString(jsonMessage.cookie);
        const gameId = jsonMessage.gameId;

        if (!bigGames[gameId] || (userRoles.has(userRole) && (!teamId || !bigGames[gameId].currentGame?.teams[teamId]))) {
            ws.send(JSON.stringify({ 'action': 'gameNotStarted' }));
            return;
        }

        if (!teamId) {
            ws.send(JSON.stringify({'action': 'ERROR', 'message': 'teamId is empty'}))
        }

        const gameType = bigGames[gameId].currentGame?.type || 'chgk';

        switch (jsonMessage.action) {
            case 'time':
                GetTime(gameId, ws);
                break;
            case 'checkTime':
                CheckTime(gameId, ws);
                break;
            case 'checkBreakTime':
                CheckBreakTime(gameId, ws, jsonMessage.time);
                break;
            case 'isOnBreak':
                IsOnBreak(gameId, ws);
                break;
            case 'checkStart':
                GetGameStatus(gameId, ws);
                break;
        }

        if (allAdminRoles.has(userRole)) {
            AdminsAction(gameId, ws, jsonMessage, gameType);
        } else {
            UsersAction(gameId, ws, jsonMessage, gameType, teamId as string);
        }
    }
}
