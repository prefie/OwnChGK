import { getTokenFromString } from './utils/jwt-token';
import { WebSocket } from 'ws';
import { BigGameLogic } from './logic/big-game-logic';
import { allAdminRoles, userRoles } from './utils/roles';
import { GameTypeLogic } from './logic/enums/game-type-logic.enum';
import { GameStatus } from './logic/enums/game-status.enum';
import { AnswerStatus } from './db/entities/answer';
import { AppealStatus } from './db/entities/appeal';
import { Game } from './logic/game';

export const bigGames: Record<string, BigGameLogic> = {};
export const gameAdmins: Record<string, Set<WebSocket>> = {};
export const gameUsers: Record<string, Set<WebSocket>> = {};
export const seconds70PerQuestion = 70000;
export const seconds20PerQuestion = 20000;
export const extra10Seconds = 10000;
export const seconds100PerQuestion = 100000;

function GiveAddedTime(gameId: number, gamePart: GameTypeLogic) {
    const game = GetGame(gameId, gamePart);
    if (game.timeIsOnPause) {
        game.leftTime += extra10Seconds;
        game.maxTime += extra10Seconds;
        for (let user of gameUsers[gameId]) {
            user.send(
                JSON.stringify({
                    action: 'addTime',
                    maxTime: game.maxTime,
                    time: game.leftTime,
                    isStarted: false
                })
            );
        }
    } else {
        if (!game.timerStarted) {
            game.leftTime += extra10Seconds;
            game.maxTime += extra10Seconds;
            for (let user of gameUsers[gameId]) {
                user.send(
                    JSON.stringify({
                        action: 'addTime',
                        maxTime: game.maxTime,
                        time: game.leftTime,
                        isStarted: false
                    })
                );
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
                user.send(
                    JSON.stringify({
                        action: 'addTime',
                        maxTime: game.maxTime,
                        time: game.leftTime,
                        isStarted: true
                    })
                );
            }
        }
    }
}

function ChangeQuestionNumber(gameId: number, questionNumber: number, tourNumber: number, activeGamePart: GameTypeLogic) {
    bigGames[gameId].currentGame = GetGame(gameId, activeGamePart);
    bigGames[gameId].currentGame.currentQuestion = [tourNumber, questionNumber];

    for (let user of gameUsers[gameId]) {
        user.send(
            JSON.stringify({
                action: 'changeQuestionNumber',
                matrixActive: { round: tourNumber, question: questionNumber },
                number: bigGames[gameId].currentGame.rounds[0].questionsCount * (tourNumber - 1) + questionNumber,
                text: bigGames[gameId].currentGame.rounds[tourNumber - 1].questions[questionNumber - 1]?.text,
                activeGamePart: activeGamePart
            })
        );
    }
}

function StartTimer(gameId: number, gamePart: GameTypeLogic, isBlitz: boolean) {
    const game = GetGame(gameId, gamePart);
    const time = GetTimeForGame(gamePart, isBlitz);
    game.leftTime = time;
    game.maxTime = time;

    if (!game.timeIsOnPause) {
        game.timerStarted = true;
        game.timer = setTimeout(() => {
            game.timerStarted = false;
            game.leftTime = 0;
        }, game.leftTime);

        for (let user of gameUsers[gameId]) {
            user.send(
                JSON.stringify({
                    action: 'start',
                    maxTime: game.maxTime,
                    time: game.leftTime
                })
            );
        }
    } else {
        game.timerStarted = true;
        game.timeIsOnPause = false;
        game.timer = setTimeout(() => {
            game.timerStarted = false;
            game.leftTime = 0;
        }, game.leftTime);
        for (let user of gameUsers[gameId]) {
            user.send(
                JSON.stringify({
                    action: 'start',
                    maxTime: game.maxTime,
                    time: game.leftTime
                })
            );
        }
    }
}

function StopTimer(gameId: number, gamePart: GameTypeLogic, isBlitz: boolean) {
    console.log(gameId, gamePart, isBlitz);
    const game = GetGame(gameId, gamePart);
    console.log(game);
    game.timerStarted = false;
    console.log(game.timerStarted);
    clearTimeout(game.timer);
    game.timeIsOnPause = false;
    const time = GetTimeForGame(gamePart, isBlitz);
    game.leftTime = time;
    game.maxTime = time;
    for (let user of gameUsers[gameId]) {
        user.send(
            JSON.stringify({
                action: 'stop',
                activeGamePart: game.type
            })
        );
    }
}

function PauseTimer(gameId: number, gamePart: GameTypeLogic) {
    const game = GetGame(gameId, gamePart);
    if (game.timerStarted) {
        game.timerStarted = false;
        game.timeIsOnPause = true;
        game.leftTime -= Math.floor(process.uptime() * 1000 - game.timer._idleStart);
        clearTimeout(game.timer);

        for (let user of gameUsers[gameId]) {
            user.send(
                JSON.stringify({
                    action: 'pause'
                })
            );
        }
    }
}

function GiveAnswer(answer: string, teamId: string, gameId: number, ws) {
    const roundNumber = bigGames[gameId].currentGame.currentQuestion[0] - 1;
    const questionNumber = bigGames[gameId].currentGame.currentQuestion[1] - 1;
    bigGames[gameId].currentGame.rounds[roundNumber].questions[questionNumber].giveAnswer(
        bigGames[gameId].currentGame.teams[teamId],
        answer,
        false
    );
    ws.send(
        JSON.stringify({
            action: 'statusAnswer',
            isAccepted: true,
            answer: answer,
            activeGamePart: GameTypeLogic.ChGK
        })
    );
}

function GiveAppeal(appeal: string, teamId: string, gameId: number, number: number, answer: string, gamePart: GameTypeLogic) {
    const game = GetGame(gameId, gamePart);
    const roundNumber = Math.ceil(number / game.rounds[0].questionsCount);
    let questionNumber = number - (roundNumber - 1) * game.rounds[0].questionsCount;
    game.rounds[roundNumber - 1].questions[questionNumber - 1].giveAppeal(teamId, appeal, answer);
}

function AcceptAnswer(gameId: number, gameType: GameTypeLogic, roundNumber: number, questionNumber: number, answers: string[]) {
    const game = GetGame(gameId, gameType);
    for (const answer of answers) {
        game.rounds[roundNumber - 1].questions[questionNumber - 1].acceptAnswers(answer);
    }
}

function ChangeAnswer(gameId: number, gameType: GameTypeLogic, teamId: string, number: number) {
    const game = GetGame(gameId, gameType);
    const roundNumber = Math.ceil(number / game.rounds[0].questionsCount);
    let questionNumber = number - (roundNumber - 1) * game.rounds[0].questionsCount;
    game.rounds[roundNumber - 1].questions[questionNumber - 1].changeAnswer(
        game.teams[teamId],
        roundNumber,
        questionNumber,
        gameType == GameTypeLogic.Matrix
    );
}

function AcceptAppeal(gameId: number, gameType: GameTypeLogic, roundNumber: number, questionNumber: number, answers: string[]) {
    const game = GetGame(gameId, gameType);
    for (const answer of answers) {
        game.rounds[roundNumber - 1].questions[questionNumber - 1].acceptAppeal(answer, '');
    }
}

function RejectAppeal(gameId: number, gameType: GameTypeLogic, roundNumber: number, questionNumber: number, answers: string[]) {
    const game = GetGame(gameId, gameType);
    for (const answer of answers) {
        game.rounds[roundNumber - 1].questions[questionNumber - 1].rejectAppeal(answer, '');
    }
}

function RejectAnswer(
    gameId: number,
    gameType: GameTypeLogic,
    roundNumber: number,
    questionNumber: number,
    answers: string[],
    isMatrixType = false
) {
    const game = GetGame(gameId, gameType);
    for (const answer of answers) {
        game.rounds[roundNumber - 1].questions[questionNumber - 1].rejectAnswers(answer, isMatrixType);
    }
}

function GetAllTeamsAnswers(gameId: number, gameType: GameTypeLogic, roundNumber: number, questionNumber: number, ws) {
    const game = GetGame(gameId, gameType);
    const answers = game.rounds[roundNumber - 1].questions[questionNumber - 1].answers.filter(ans => ans.text.length > 0);
    const acceptedAnswers = answers.filter(ans => ans.status == AnswerStatus.RIGHT).map(ans => ans.text);
    const rejectedAnswers = answers
        .filter(ans => ans.status == AnswerStatus.WRONG || ans.status == AnswerStatus.ON_APPEAL)
        .map(ans => ans.text);
    const uncheckedAnswers = answers.filter(ans => ans.status == AnswerStatus.UNCHECKED).map(ans => ans.text);
    ws.send(
        JSON.stringify({
            action: 'answers',
            acceptedAnswers: acceptedAnswers,
            rejectedAnswers: rejectedAnswers,
            uncheckedAnswers: uncheckedAnswers
        })
    );
}

function GetAppealsByNumber(gameId: number, gameType: GameTypeLogic, roundNumber: number, questionNumber: number, ws) {
    const game = GetGame(gameId, gameType);
    const appeals = game.rounds[roundNumber - 1].questions[questionNumber - 1].appeals
        .filter(appeal => appeal.status == AppealStatus.UNCHECKED)
        .map(appeal => {
            return {
                teamName: game.teams[appeal.teamId].name,
                text: appeal.text,
                answer: game.teams[appeal.teamId].getAnswer(roundNumber, questionNumber)?.text
            };
        });

    ws.send(
        JSON.stringify({
            action: 'appealsByNumber',
            appeals
        })
    );
}

function GetAllAppeals(gameId: number, ws) {
    // Тут вроде CurrentGame законно: метод нужен для индикации апелляций в текущей игре
    const res = [];
    for (let roundNumber = 0; roundNumber < bigGames[gameId].currentGame.getRoundsCount(); roundNumber++) {
        for (
            let questionNumber = 0;
            questionNumber < bigGames[gameId].currentGame.rounds[roundNumber].questions.length;
            questionNumber++
        ) {
            if (
                bigGames[gameId].currentGame.rounds[roundNumber].questions[questionNumber].appeals.filter(
                    a => a.status == AppealStatus.UNCHECKED
                ).length > 0
            )
                res.push(
                    roundNumber * bigGames[gameId].currentGame.rounds[roundNumber].questions.length + (questionNumber + 1)
                );
        }
    }
    ws.send(
        JSON.stringify({
            action: 'appeals',
            appealByQuestionNumber: res
        })
    );
}

function GiveAnswerMatrix(
    answer: string,
    roundNumber: number,
    questionNumber: number,
    roundName: string,
    teamId: string,
    gameId: string,
    ws
) {
    bigGames[gameId].matrixGame.rounds[roundNumber - 1].questions[questionNumber - 1].giveAnswer(
        bigGames[gameId].matrixGame.teams[teamId],
        answer,
        false
    );
    ws.send(
        JSON.stringify({
            action: 'statusAnswer',
            isAccepted: true,
            roundNumber: roundNumber,
            questionNumber: questionNumber,
            roundName: roundName,
            answer: answer,
            activeGamePart: GameTypeLogic.Matrix
        })
    );
}

function StartBreakTime(gameId, time) {
    bigGames[gameId].startBreak(time);
    for (const adminWs of gameAdmins[gameId]) {
        adminWs.send(
            JSON.stringify({
                action: 'isOnBreak',
                status: true,
                time: time
            })
        );
    }
    for (const userWs of gameUsers[gameId]) {
        userWs.send(
            JSON.stringify({
                action: 'isOnBreak',
                status: true,
                time: time
            })
        );
    }
}

function StopBreakTime(gameId) {
    bigGames[gameId].stopBreak();
    for (const userWs of gameUsers[gameId]) {
        userWs.send(
            JSON.stringify({
                action: 'isOnBreak',
                status: false,
                time: 0
            })
        );
    }
}

function GetQuestionNumber(gameId, ws) {
    if (!bigGames[gameId].currentGame.currentQuestion) {
        ws.send(
            JSON.stringify({
                action: 'questionNumberIsUndefined',
                activeGamePart: bigGames[gameId].currentGame.type
            })
        );
        return;
    }

    ws.send(
        JSON.stringify({
            action: 'changeQuestionNumber',
            round: bigGames[gameId].currentGame.currentQuestion[0],
            question: bigGames[gameId].currentGame.currentQuestion[1],
            activeGamePart: bigGames[gameId].currentGame.type
        })
    );
}

function GetTeamAnswers(gameId, teamId, ws) {
    let answer: { [key: string]: { number: number; answer: string; status: AnswerStatus }[] };
    answer = {};
    if (bigGames[gameId].chGKGame) {
        const chgk = bigGames[gameId].chGKGame.teams[teamId].getAnswers();
        answer['chgk'] = chgk.map(ans => {
            return {
                number: (ans.roundNumber - 1) * bigGames[gameId].chGKGame.rounds[0].questionsCount + ans.questionNumber,
                roundNumber: ans.roundNumber,
                questionNumber: ans.questionNumber,
                answer: ans.text,
                status: ans.status
            };
        });
    }
    if (bigGames[gameId].matrixGame) {
        const matrix = bigGames[gameId].matrixGame.teams[teamId].getAnswers();

        answer['matrix'] = matrix.map(ans => {
            return {
                number: (ans.roundNumber - 1) * bigGames[gameId].matrixGame.rounds[0].questionsCount + ans.questionNumber,
                roundNumber: ans.roundNumber,
                questionNumber: ans.questionNumber,
                answer: ans.text,
                status: ans.status
            };
        });
    }
    if (bigGames[gameId].quizGame) {
        const quiz = bigGames[gameId].quizGame.teams[teamId].getAnswers();

        answer['quiz'] = quiz.map(ans => {
            return {
                number: (ans.roundNumber - 1) * bigGames[gameId].quizGame.rounds[0].questionsCount + ans.questionNumber,
                roundNumber: ans.roundNumber,
                questionNumber: ans.questionNumber,
                answer: ans.text,
                status: ans.status
            };
        });
    }

    ws.send(
        JSON.stringify({
            action: 'teamAnswers',
            chgkAnswers: answer['chgk'],
            matrixAnswers: answer['matrix'],
            quiz: answer['quiz']
        })
    );
}

function GetTeamAnswersForAdmin(gameId, teamId, ws) {
    let answer: { [key: string]: { number: number; answer: string; status: AnswerStatus }[] };
    answer = {};
    if (bigGames[gameId].chGKGame) {
        const chgk = bigGames[gameId].chGKGame.teams[teamId].getAnswers();
        answer['chgk'] = chgk.map(ans => {
            return {
                number: (ans.roundNumber - 1) * bigGames[gameId].chGKGame.rounds[0].questionsCount + ans.questionNumber,
                roundNumber: ans.roundNumber,
                questionNumber: ans.questionNumber,
                answer: ans.text,
                status: ans.status
            };
        });
    }
    if (bigGames[gameId].matrixGame) {
        const matrix = bigGames[gameId].matrixGame.teams[teamId].getAnswers();
        answer['matrix'] = matrix.map(ans => {
            return {
                number: (ans.roundNumber - 1) * bigGames[gameId].matrixGame.rounds[0].questionsCount + ans.questionNumber,
                roundNumber: ans.roundNumber,
                questionNumber: ans.questionNumber,
                answer: ans.text,
                status: ans.status
            };
        });
    }

    ws.send(
        JSON.stringify({
            action: 'teamAnswersForAdmin',
            chgkAnswers: answer['chgk'],
            matrixAnswers: answer['matrix'],
            chgkQuestionsCount: bigGames[gameId].chGKGame
                ? bigGames[gameId].chGKGame.getRoundsCount() * bigGames[gameId].chGKGame.rounds[0].questionsCount
                : 0,
            matrixQuestionsCount: bigGames[gameId].matrixGame
                ? bigGames[gameId].matrixGame.getRoundsCount() * bigGames[gameId].matrixGame.rounds[0].questionsCount
                : 0
        })
    );
}

function NotifyAdminsAboutAppeal(gameId, number) {
    for (let ws of gameAdmins[gameId])
        ws.send(
            JSON.stringify({
                action: 'appeal',
                questionNumber: number
            })
        );
}

function AdminsAction(gameId, ws, jsonMessage, gameType) {
    if (gameAdmins[gameId] && !gameAdmins[gameId].has(ws)) {
        gameAdmins[gameId].add(ws);
        ws.on('close', function () {
            gameAdmins[gameId]?.delete(ws);
        });
    }

    switch (jsonMessage.action) {
        case '+10sec':
            GiveAddedTime(gameId, jsonMessage.gamePart);
            break;
        case 'Start':
            StartTimer(gameId, jsonMessage.gamePart, jsonMessage.isBlitz);
            break;
        case 'Pause':
            PauseTimer(gameId, jsonMessage.gamePart);
            break;
        case 'Stop':
            StopTimer(gameId, jsonMessage.gamePart, jsonMessage.isBlitz);
            break;
        case 'AcceptAnswer':
            AcceptAnswer(
                gameId,
                jsonMessage.gamePart,
                jsonMessage.roundNumber,
                jsonMessage.questionNumber,
                jsonMessage.answers
            );
            break;
        case 'AcceptAppeals':
            AcceptAppeal(
                gameId,
                jsonMessage.gamePart,
                jsonMessage.roundNumber,
                jsonMessage.questionNumber,
                jsonMessage.appeals
            );
            break;
        case 'RejectAnswer':
            RejectAnswer(
                gameId,
                jsonMessage.gamePart,
                jsonMessage.roundNumber,
                jsonMessage.questionNumber,
                jsonMessage.answers,
                gameType == GameTypeLogic.Matrix
            );
            break;
        case 'RejectAppeals':
            RejectAppeal(
                gameId,
                jsonMessage.gamePart,
                jsonMessage.roundNumber,
                jsonMessage.questionNumber,
                jsonMessage.appeals
            );
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

function UsersAction(gameId, ws, jsonMessage, gameType, teamId) {
    if (!bigGames[gameId].currentGame) {
        ws.send(
            JSON.stringify({
                action: 'error',
                gameIsStarted: bigGames[gameId].currentGame
            })
        );
        return;
    }
    if (gameUsers[gameId] && !gameUsers[gameId].has(ws)) {
        gameUsers[gameId].add(ws);
        ws.on('close', function () {
            gameUsers[gameId]?.delete(ws);
        });
    }
    switch (jsonMessage.action) {
        case 'Answer':
            if (gameType == GameTypeLogic.ChGK && bigGames[gameId].currentGame.timerStarted) {
                GiveAnswer(jsonMessage.answer.trim(), teamId, gameId, ws);
            } else if (gameType == GameTypeLogic.Matrix) {
                GiveAnswerMatrix(
                    jsonMessage.answer.trim(),
                    jsonMessage.roundNumber,
                    jsonMessage.questionNumber,
                    jsonMessage.roundName,
                    teamId,
                    gameId,
                    ws
                );
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

function GetPreliminaryTime(gameId) {
    if (bigGames[gameId].currentGame.timer) {
        const pastDelay = Math.floor(process.uptime() * 1000 - bigGames[gameId].currentGame.timer._idleStart);
        const initialDelay = bigGames[gameId].currentGame.timer._idleTimeout;
        if (bigGames[gameId].currentGame.timerStarted) {
            return initialDelay - pastDelay;
        } else {
            return bigGames[gameId].currentGame.leftTime;
        }
    }

    return bigGames[gameId].currentGame.leftTime;
}

function GetTime(gameId, ws) {
    ws.send(
        JSON.stringify({
            action: 'time',
            isStarted: bigGames[gameId].currentGame.timerStarted,
            maxTime: bigGames[gameId].currentGame.maxTime,
            time: GetPreliminaryTime(gameId),
            gamePart: bigGames[gameId].currentGame.type
        })
    );
}

function CheckTime(gameId, ws) {
    ws.send(
        JSON.stringify({
            action: 'checkTime',
            maxTime: bigGames[gameId].currentGame.maxTime,
            time: GetPreliminaryTime(gameId),
            gamePart: bigGames[gameId].currentGame.type
        })
    );
}

function CheckBreakTime(gameId, ws, time) {
    ws.send(
        JSON.stringify({
            action: 'checkBreakTime',
            currentTime: time,
            time: bigGames[gameId].breakTime
        })
    );
}

function IsOnBreak(gameId, ws) {
    ws.send(
        JSON.stringify({
            action: 'isOnBreak',
            status: bigGames[gameId].status == GameStatus.IsOnBreak,
            time: bigGames[gameId].breakTime
        })
    );
}

function GetGameStatus(gameId, ws) {
    const currentGame = bigGames[gameId]?.currentGame;

    if (currentGame) {
        const currentRound = currentGame.currentQuestion ? currentGame.currentQuestion[0] : null;
        const currentQuestion = currentGame.currentQuestion ? currentGame.currentQuestion[1] : null;
        const currentQuestionNumber = currentGame.currentQuestion
            ? currentGame.rounds[0].questionsCount * (currentRound - 1) + currentQuestion
            : undefined;

        ws.send(
            JSON.stringify({
                action: 'gameStatus',
                isStarted: !!bigGames[gameId] && !!bigGames[gameId].currentGame.currentQuestion,
                activeGamePart: currentGame.type,
                isOnBreak: bigGames[gameId].status == GameStatus.IsOnBreak,
                breakTime: bigGames[gameId].breakTime,
                currentQuestionNumber: currentQuestionNumber, //todo: тут вроде надо ток для чгк
                active:
                    currentGame.type == GameTypeLogic.Matrix && currentGame.currentQuestion
                        ? {
                              round: currentRound,
                              question: currentQuestion
                          }
                        : null,
                question: {
                    number: currentQuestionNumber,
                    text: currentGame.rounds[currentRound - 1]?.questions[currentQuestion - 1]?.text
                },
                round: {
                    number: currentRound,
                    name: currentGame.rounds[currentRound - 1]?.name || ''
                },
                text: currentGame.rounds[currentRound - 1]?.questions[currentQuestion - 1]?.text,
                maxTime: currentGame.maxTime,
                time: GetPreliminaryTime(gameId)
            })
        );
    }
}

function GetNotAuthorizeMessage(ws) {
    ws.send(JSON.stringify({ action: 'notAuthorized' }));
}

function GetGame(gameId: number, gamePart: GameTypeLogic): Game {
    switch (gamePart) {
        case GameTypeLogic.ChGK:
            return bigGames[gameId].chGKGame;
        case GameTypeLogic.Matrix:
            return bigGames[gameId].matrixGame;
        default:
            return bigGames[gameId].quizGame;
    }
}

function GetTimeForGame(gamePart: GameTypeLogic, isBlitz: boolean): number {
    switch (gamePart) {
        case GameTypeLogic.ChGK:
            return seconds70PerQuestion;
        case GameTypeLogic.Matrix:
            return seconds20PerQuestion;
        default:
            return isBlitz ? seconds100PerQuestion : seconds20PerQuestion;
    }
}

export function HandlerWebsocket(ws: WebSocket, message: string) {
    message += '';
    const jsonMessage = JSON.parse(message);
    if (jsonMessage.action == 'ping') {
        ws.send(JSON.stringify({ action: 'pong' }));
        return;
    }

    if (!jsonMessage || !jsonMessage.cookie || !jsonMessage.gameId) {
        GetNotAuthorizeMessage(ws);
    } else {
        const { role: userRole, teamId: teamId } = getTokenFromString(jsonMessage.cookie);
        const gameId = jsonMessage.gameId;

        if (!bigGames[gameId] || (userRoles.has(userRole) && !bigGames[gameId].currentGame.teams[teamId])) {
            ws.send(JSON.stringify({ action: 'gameNotStarted' }));
            return;
        }

        const gameType = bigGames[gameId].currentGame.type;

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
            UsersAction(gameId, ws, jsonMessage, gameType, teamId);
        }
    }
}
