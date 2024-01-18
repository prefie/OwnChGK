import React, { ChangeEvent, FC, useEffect, useState } from 'react';
import classes from './user-game.module.scss';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import Header from '../../components/header/header';
import { Link, useParams } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';
import { UserGameProps } from '../../entities/user-game/user-game.interfaces';
import { getCookie, getUrlForSocket } from '../../commonFunctions';
import Loader from '../../components/loader/loader';
import { AppState } from '../../entities/app/app.interfaces';
import { connect } from 'react-redux';
import MobileNavbar from '../../components/mobile-navbar/mobile-navbar';
import Scrollbar from '../../components/scrollbar/scrollbar';
import { Input } from '../../components/input/input';
import readyOwlImage from '../../images/owl-images/ready-owl.svg';
import breakOwlImage from '../../images/owl-images/break_owl.svg';
import { AnswerQuizType, GamePartSettings, RoundType } from '../../server-api/type';
import { ServerApi } from '../../server-api/server-api';
import CustomCheckbox from '../../components/custom-checkbox/custom-checkbox';

let progressBarInterval: any;
let interval: any;
let checkStart: any;
let ping: any;
let conn: WebSocket;

export enum GameType {
    chgk = 'chgk',
    matrix = 'matrix',
    quiz = 'quiz'
}

const UserGame: FC<UserGameProps> = props => {
    const [mediaMatch, setMediaMatch] = useState<MediaQueryList>(window.matchMedia('(max-width: 600px)'));
    const { gameId } = useParams<{
        gameId: string;
    }>();
    const [gameName, setGameName] = useState<string>();
    const [gamePart, setGamePart] = useState<GameType>(); // активная часть игры
    const [activeRound, setActiveRound] = useState<{
        number: number;
        name: string;
    }>({ number: 0, name: '' });
    const [activeQuestion, setActiveQuestion] = useState<{
        number: number;
        question: string;
    }>({
        number: 0,
        question: ''
    });
    const [timeForAnswer, setTimeForAnswer] = useState<number>(70);
    const [maxTime, setMaxTime] = useState<number>(70);
    const [flags, setFlags] = useState<{
        isSnackbarOpen: boolean;
        isAnswerAccepted: boolean;
        isSnackbarQuizOpen: boolean;
    }>({
        isSnackbarOpen: false,
        isAnswerAccepted: false,
        isSnackbarQuizOpen: false
    });
    const [isBreak, setIsBreak] = useState<boolean>(false);
    const [breakTime, setBreakTime] = useState<number>(0);
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [isConnectionError, setIsConnectionError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [chgkSettings, setChgkSettings] = useState<GamePartSettings>();
    const [answerChgk, setAnswerChgk] = useState<string>('');
    const [acceptedAnswerChgk, setAcceptedAnswerChgk] = useState<string>('');

    const [matrixSettings, setMatrixSettings] = useState<GamePartSettings>();
    const [answersMatrix, setAnswersMatrix] = useState<{
        [key: number]: string[];
    } | null>(null); // Заполнить там же, где matrixSettings, вызвав fillMatrixAnswers(tourNames, questionsCount)
    const [acceptedAnswersMatrix, setAcceptedAnswersMatrix] = useState<{
        [key: number]: string[];
    } | null>(null); // Заполнить там же, где matrixSettings, вызвав fillMatrixAnswers(tourNames, questionsCount)

    const [quizSettings, setQuizSettings] = useState<GamePartSettings>();
    const [answersQuiz, setAnswersQuiz] = useState<{
        [key: number]: AnswerQuizType[];
    } | null>(null); // Заполнить там же, где matrixSettings, вызвав fillMatrixAnswers(tourNames, questionsCount)
    const [acceptedAnswersQuiz, setAcceptedAnswersQuiz] = useState<{
        [key: number]: AnswerQuizType[];
    } | null>(null); // Заполнить там же, где matrixSettings, вызвав fillMatrixAnswers(tourNames, questionsCount)

    const requester = {
        getPayload: (obj: any) =>
            JSON.stringify({
                cookie: getCookie('authorization'),
                gameId: gameId,
                ...obj
            }),

        startRequests: () => {
            conn.send(requester.getPayload({ action: 'checkStart' }));
            requester.getTeamAnswers();
            clearInterval(checkStart);
            checkStart = setInterval(() => {
                if (!isGameStarted) {
                    conn.send(requester.getPayload({ action: 'checkStart' }));
                } else {
                    clearInterval(checkStart);
                }
            }, 5000);

            clearInterval(ping);
            ping = setInterval(() => {
                conn.send(JSON.stringify({ action: 'ping' }));
            }, 30000);
        },

        checkBreak: () => {
            conn.send(requester.getPayload({ action: 'isOnBreak' }));
        },

        getQuestionTime: () => {
            conn.send(requester.getPayload({ action: 'time' }));
        },

        checkTime: () => {
            conn.send(requester.getPayload({ action: 'checkTime' }));
        },

        giveAnswerToChgk: (answer: string) => {
            conn.send(
                requester.getPayload({
                    action: 'Answer',
                    answer: answer
                })
            );
        },

        giveAnswerToMatrix: (answer: string, roundNumber: number, questionNumber: number, roundName: string) => {
            conn.send(
                requester.getPayload({
                    action: 'Answer',
                    answer: answer,
                    roundNumber: roundNumber,
                    questionNumber: questionNumber,
                    roundName: roundName
                })
            );
        },

        giveAnswerToQuiz: (
            answer: string,
            isBlitz: boolean,
            roundNumber: number,
            questionNumber: number,
            roundName: string
        ) => {
            conn.send(
                requester.getPayload({
                    action: 'Answer',
                    answer: answer,
                    isBlitz: isBlitz,
                    roundNumber: roundNumber,
                    questionNumber: questionNumber,
                    roundName: roundName
                })
            );
        },

        getTeamAnswers: () => {
            conn.send(requester.getPayload({ action: 'getTeamAnswers' }));
        },

        checkBreakTime: (time: number) => {
            conn.send(
                requester.getPayload({
                    action: 'checkBreakTime',
                    time: time
                })
            );
        }
    };

    const handler = {
        handleGameNotStartedMessage: () => {
            setIsGameStarted(false);
            setIsLoading(false);
        },

        handleGameStatusMessage: (
            isStarted: boolean,
            gamePart: GameType,
            isOnBreak: boolean,
            breakTime: number,
            question: {
                number: number;
                text: string;
            },
            round: {
                number: number;
                name: string;
            },
            maxTime: number,
            time: number
        ) => {
            if (isStarted) {
                setGamePart(gamePart);
                setIsGameStarted(true);
                clearInterval(checkStart);
                clearInterval(interval);
                setActiveQuestion({ number: question.number || 1, question: question.text ?? '' });
                setActiveRound(round);
                setTimeForAnswer(time / 1000);
                setMaxTime(maxTime / 1000);
                if (isOnBreak) {
                    setIsBreak(true);
                    setBreakTime(breakTime);
                    interval = setInterval(
                        () =>
                            setBreakTime(time => {
                                requester.checkBreakTime(time);
                                if (time - 1 <= 0) {
                                    clearInterval(interval);
                                    setIsBreak(false);
                                }
                                return time - 1 > 0 ? time - 1 : 0;
                            }),
                        1000
                    );
                }
                setIsLoading(false);
                requester.getQuestionTime();
            } else {
                setIsLoading(false);
            }
        },

        handleGetTeamAnswers: (
            matrixAnswers: {
                roundNumber: number;
                questionNumber: number;
                answer: string;
            }[],
            quizAnswers: {
                roundNumber: number;
                questionNumber: number;
                answer: string;
            }[]
        ) => {
            setAcceptedAnswersMatrix(prevValue => {
                const copy = prevValue ? { ...prevValue } : {};
                if (!matrixAnswers) {
                    return copy;
                }

                for (const answer of matrixAnswers) {
                    copy[answer.roundNumber][answer.questionNumber - 1] = answer.answer;
                }
                return copy;
            });

            setAcceptedAnswersQuiz(prevValue => {
                const copy = prevValue ? { ...prevValue } : {};
                if (!quizAnswers) {
                    return copy;
                }

                for (const answer of quizAnswers) {
                    copy[answer.roundNumber][answer.questionNumber - 1] = { answer: answer.answer, blitz: false };
                }
                return copy;
            });
        },

        handleTimeMessage: (time: number, maxTime: number, isStarted: boolean, gamePart: GameType) => {
            setTimeForAnswer(() => {
                const progress = document.querySelector('#progress-bar') as HTMLDivElement;
                const width = Math.ceil((100 * time) / maxTime);
                if (!progress) {
                    //setIsConnectionError(true)
                } else {
                    progress.style.width = width + '%';
                    changeColor(progress, gamePart, Math.round(time / 1000));
                }
                return time / 1000;
            });
            if (isStarted) {
                clearInterval(progressBarInterval);
                progressBarInterval = moveProgressBar(time, maxTime);
            }
            setMaxTime(maxTime / 1000);
        },

        handleCheckTimeMessage: (time: number, maxTime: number, gamePart: GameType) => {
            const progressBar = document.querySelector('#progress-bar') as HTMLDivElement;
            if (!progressBar || time == 0) {
                clearInterval(progressBarInterval);
            }

            const width = Math.ceil((100 * time) / maxTime);
            progressBar.style.width = width + '%';
            changeColor(progressBar, gamePart, Math.round(time / 1000));

            const newTime = Math.round(time / 1000);
            setTimeForAnswer(newTime);
            setMaxTime(Math.round(maxTime / 1000));
        },

        handleCheckBreakTimeMessage: (currentTime: number, time: number) => {
            setBreakTime(time);
        },

        handleStartMessage: (time: number, maxTime: number) => {
            setTimeForAnswer(time / 1000);
            clearInterval(progressBarInterval);
            progressBarInterval = moveProgressBar(time, maxTime);
            setMaxTime(maxTime / 1000);
        },

        handleAddTimeMessage: (time: number, maxTime: number, isStarted: boolean) => {
            clearInterval(progressBarInterval);
            setTimeForAnswer(t => (t ?? 0) + 10);
            if (isStarted) {
                clearInterval(progressBarInterval);
                progressBarInterval = moveProgressBar(time, maxTime);
            }
            setMaxTime(maxTime / 1000);
        },

        handlePauseMessage: () => {
            clearInterval(progressBarInterval);
        },

        handleStopMessage: (gamePart: GameType, time: number) => {
            clearInterval(progressBarInterval);
            setTimeForAnswer(time / 1000);
            let progress = document.querySelector('#progress-bar') as HTMLDivElement;
            if (progress) {
                progress.style.width = '100%';
                changeColor(progress, gamePart, time / 1000);
            }
        },

        handleChangeQuestionNumberMessage: (
            gamePart: GameType,
            question: {
                number: number;
                text: string;
            },
            round: {
                number: number;
                name: string;
            },
            old: {
                numberRoundOld: number;
                gamePartOld: string;
            },
            isBlitz: boolean
        ) => {
            if (gamePart === GameType.chgk) {
                setAnswerChgk('');
                setAcceptedAnswerChgk('');
            }

            if (old.gamePartOld === GameType.matrix && gamePart !== GameType.matrix && matrixSettings) {
                const answers: {
                    [key: number]: string[];
                } = {};
                for (let i = 1; i <= (matrixSettings?.roundsCount || 0); i++) {
                    answers[i] = Array(matrixSettings?.questionsCount).fill('');
                }
                fillMatrixAnswers(matrixSettings.roundsCount, matrixSettings.questionsCount);
            }

            if (old.gamePartOld === GameType.quiz && gamePart !== GameType.quiz && quizSettings) {
                const answers: {
                    [key: number]: AnswerQuizType[];
                } = {};
                for (let i = 1; i <= (matrixSettings?.roundsCount || 0); i++) {
                    answers[i] = Array(matrixSettings?.questionsCount).fill('');
                }
                fillQuizAnswers(quizSettings.roundsCount, quizSettings.questionsCount);
            }

            if (
                !(
                    old.gamePartOld === GameType.quiz &&
                    gamePart === GameType.quiz &&
                    old.numberRoundOld === round.number &&
                    isBlitz
                )
            ) {
                clearInterval(progressBarInterval);

                let progress = document.querySelector('#progress-bar') as HTMLDivElement;
                if (progress) {
                    progress.style.width = '100%';
                }
                changeColor(progress, gamePart, gamePart === GameType.chgk ? 70 : isBlitz ? 100 : 20);
                setTimeForAnswer(gamePart === GameType.chgk ? 70 : isBlitz ? 100 : 20);
                setMaxTime(gamePart === GameType.chgk ? 70 : isBlitz ? 100 : 20);
            }

            setActiveRound(round);
            setActiveQuestion({ number: question.number || 1, question: question.text ?? '' });

            setGamePart(gamePart);
        },

        handleStatusAnswerMessage: (
            gamePart: GameType,
            newAnswer: string,
            roundNumber: number,
            questionNumber: number,
            isOnPause: boolean,
            isAccepted: boolean
        ) => {
            switch (gamePart) {
                case GameType.chgk: {
                    setAcceptedAnswerChgk(newAnswer);
                    break;
                }
                case GameType.matrix: {
                    setAcceptedAnswersMatrix(prevValue => {
                        const copy = { ...prevValue };
                        copy[roundNumber] = copy[roundNumber].map((answer, i) =>
                            i === questionNumber - 1 ? newAnswer : answer
                        );
                        return copy;
                    });
                    break;
                }
                default: {
                    if (isOnPause) break;
                    setAcceptedAnswersQuiz(prevValue => {
                        const copy = { ...prevValue };
                        copy[roundNumber] = copy[roundNumber].map((answer, i) =>
                            i === questionNumber - 1 ? { answer: newAnswer, blitz: false } : answer
                        );
                        return copy;
                    });
                }
            }

            if (isOnPause) {
                setFlags({
                    isAnswerAccepted: false,
                    isSnackbarOpen: false,
                    isSnackbarQuizOpen: true
                });
            } else {
                if (isAccepted) {
                    setFlags({
                        isAnswerAccepted: true,
                        isSnackbarOpen: true,
                        isSnackbarQuizOpen: false
                    });
                } else {
                    setFlags({
                        isAnswerAccepted: false,
                        isSnackbarOpen: true,
                        isSnackbarQuizOpen: false
                    });
                }
            }
            setTimeout(
                () =>
                    setFlags(flags => ({
                        isSnackbarOpen: false,
                        isAnswerAccepted: flags.isAnswerAccepted,
                        isSnackbarQuizOpen: false
                    })),
                5000
            );
        },

        handleIsOnBreakMessage: (status: boolean, time: number) => {
            if (status) {
                setIsBreak(true);
                setBreakTime(time);
                clearInterval(interval);
                interval = setInterval(
                    () =>
                        setBreakTime(time => {
                            requester.checkBreakTime(time);
                            if (time - 1 <= 0) {
                                clearInterval(interval);
                                setIsBreak(false);
                            }
                            return time - 1 > 0 ? time - 1 : 0;
                        }),
                    1000
                );
            } else {
                clearInterval(interval);
                setIsBreak(false);
                setBreakTime(0);
            }

            if (isLoading) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        const resizeEventHandler = () => {
            setMediaMatch(window.matchMedia('(max-width: 600px)'));
        };

        mediaMatch.addEventListener('change', resizeEventHandler);

        return () => {
            mediaMatch.removeEventListener('change', resizeEventHandler);
        };
    }, []);

    useEffect(() => {
        const openWs = () => {
            conn = new WebSocket(getUrlForSocket());

            conn.onopen = () => requester.startRequests();
            conn.onclose = () => setIsConnectionError(true);
            conn.onerror = () => setIsConnectionError(true);

            conn.onmessage = function (event) {
                const jsonMessage = JSON.parse(event.data);

                switch (jsonMessage.action) {
                    case 'gameNotStarted':
                        handler.handleGameNotStartedMessage();
                        break;
                    case 'gameStatus':
                        handler.handleGameStatusMessage(
                            jsonMessage.isStarted,
                            jsonMessage.activeGamePart,
                            jsonMessage.isOnBreak,
                            jsonMessage.breakTime,
                            jsonMessage.question,
                            jsonMessage.round,
                            jsonMessage.maxTime,
                            jsonMessage.time
                        );
                        break;
                    case 'time':
                        handler.handleTimeMessage(
                            jsonMessage.time,
                            jsonMessage.maxTime,
                            jsonMessage.isStarted,
                            jsonMessage.gamePart
                        );
                        break;
                    case 'checkTime':
                        handler.handleCheckTimeMessage(jsonMessage.time, jsonMessage.maxTime, jsonMessage.gamePart);
                        break;
                    case 'start':
                        handler.handleStartMessage(jsonMessage.time, jsonMessage.maxTime);
                        break;
                    case 'addTime':
                        handler.handleAddTimeMessage(jsonMessage.time, jsonMessage.maxTime, jsonMessage.isStarted);
                        break;
                    case 'pause':
                        handler.handlePauseMessage();
                        break;
                    case 'stop':
                        handler.handleStopMessage(jsonMessage.activeGamePart, jsonMessage.time);
                        break;
                    case 'changeQuestionNumber':
                        handler.handleChangeQuestionNumberMessage(
                            jsonMessage.activeGamePart,
                            jsonMessage.question,
                            jsonMessage.round,
                            jsonMessage.old,
                            jsonMessage.isBlitz
                        );
                        break;
                    case 'statusAnswer':
                        handler.handleStatusAnswerMessage(
                            jsonMessage.activeGamePart,
                            jsonMessage.answer,
                            jsonMessage.roundNumber,
                            jsonMessage.questionNumber,
                            jsonMessage.isOnPause,
                            jsonMessage.isAccepted
                        );
                        break;
                    case 'isOnBreak':
                        handler.handleIsOnBreakMessage(jsonMessage.status, jsonMessage.time);
                        break;
                    case 'teamAnswers':
                        handler.handleGetTeamAnswers(jsonMessage.matrixAnswers, jsonMessage.quizAnswers);
                        break;
                    case 'checkBreakTime':
                        handler.handleCheckBreakTimeMessage(jsonMessage.currentTime, jsonMessage.time);
                        break;
                }
            };
        };

        ServerApi.getGame(gameId).then(res => {
            if (res.status === 200) {
                res.json().then(({ name, chgkSettings, matrixSettings, quizSettings }) => {
                    setGameName(name);

                    if (matrixSettings) {
                        setMatrixSettings(matrixSettings);
                        fillMatrixAnswers(matrixSettings.roundsCount, matrixSettings.questionsCount);
                    } else {
                        setMatrixSettings(undefined);
                    }

                    if (quizSettings) {
                        setQuizSettings(quizSettings);
                        fillQuizAnswers(quizSettings.roundsCount, quizSettings.questionsCount);
                    } else {
                        setQuizSettings(undefined);
                    }

                    if (chgkSettings) {
                        setChgkSettings(chgkSettings);
                    } else {
                        setChgkSettings(undefined);
                    }

                    openWs();
                });
            }
        });

        return () => clearInterval(ping);
    }, []);

    const fillMatrixAnswers = (roundsCount: number, questionsCount: number) => {
        const answers: {
            [key: number]: string[];
        } = {};
        for (let i = 1; i <= roundsCount; i++) {
            answers[i] = Array(questionsCount).fill('');
        }
        setAnswersMatrix(answers);
        setAcceptedAnswersMatrix(answers);
    };

    const fillQuizAnswers = (roundsCount: number, questionsCount: number) => {
        const answers: {
            [key: number]: AnswerQuizType[];
        } = {};
        for (let i = 1; i <= roundsCount; i++) {
            answers[i] = Array(questionsCount).fill('');
        }
        setAnswersQuiz(answers);
        setAcceptedAnswersQuiz(answers);
    };

    const getTeamName = () => {
        const teamName = props.userTeam;
        const maxLength = mediaMatch.matches ? 25 : 45;
        if (teamName.length > maxLength) {
            return teamName.substring(0, maxLength + 1) + '\u2026';
        }
        return teamName;
    };

    const parseTimer = () => {
        const minutes = Math.floor(breakTime / 60)
            .toString()
            .padStart(1, '0');
        const sec = Math.floor(breakTime % 60)
            .toString()
            .padStart(2, '0');
        return `${minutes}:${sec}`;
    };

    const changeColor = (progressBar: HTMLDivElement, gamePart: GameType, time: number) => {
        if (!progressBar) {
            return;
        }

        if (progressBar.style.width) {
            progressBar.style.backgroundColor = chooseColor(time, gamePart);
        }
    };

    const chooseColor = (time: number, gamePart: GameType) => {
        const redTime = gamePart === GameType.chgk ? 10 : 5;
        const yellowTime = gamePart === GameType.chgk ? 25 : 10;
        switch (true) {
            case time <= redTime: // 10-0, 5-0
                return 'var(--color-fill-progressBar-red)';
            case redTime < time && time <= yellowTime: // 35-11, 10-6
                return 'var(--color-fill-progressBar-yellow)';
        }
        return 'var(--color-fill-progressBar-green)'; // 70-36, 20-11
    };

    const moveProgressBar = (time: number, maxTime: number) => {
        return setInterval(() => requester.checkTime(), 1000);
    };

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setFlags(flags => ({
            isSnackbarOpen: false,
            isAnswerAccepted: flags.isAnswerAccepted,
            isSnackbarQuizOpen: false
        }));
    };

    const handleAnswer = (
        event: React.ChangeEvent<HTMLInputElement>,
        gamePart: GameType,
        questionNumber: number,
        roundNumber: number
    ) => {
        switch (gamePart) {
            case GameType.chgk: {
                setAnswerChgk(event.target.value);
                break;
            }
            case GameType.matrix: {
                setAnswersMatrix(prevValue => {
                    const copy = { ...prevValue };
                    copy[roundNumber] = copy[roundNumber].map((answer, i) =>
                        i === questionNumber ? event.target.value : answer
                    );
                    return copy;
                });
                break;
            }
            default: {
                if (event.target.type === 'checkbox') {
                    setAnswersQuiz(prevValue => {
                        const copy = { ...prevValue };
                        copy[roundNumber] = copy[roundNumber].map((answer, i) =>
                            i === questionNumber ? { answer: answer.answer, blitz: event.target.checked } : answer
                        );
                        return copy;
                    });
                } else {
                    setAnswersQuiz(prevValue => {
                        const copy = { ...prevValue };
                        copy[roundNumber] = copy[roundNumber].map((answer, i) =>
                            i === questionNumber ? { answer: event.target.value, blitz: answer.blitz } : answer
                        );
                        return copy;
                    });
                }
            }
        }
    };

    const handleSendChgkAnswer = () => {
        requester.giveAnswerToChgk(answerChgk);
    };

    const handleSendMatrixAnswer = (questionNumber: number, roundName: string, roundNumber: number) => {
        requester.giveAnswerToMatrix(
            answersMatrix?.[roundNumber]?.[questionNumber - 1] as string,
            roundNumber,
            questionNumber,
            roundName
        );
    };

    const handleSendQuizAnswer = (questionNumber: number, roundName: string, roundNumber: number) => {
        requester.giveAnswerToQuiz(
            answersQuiz?.[roundNumber]?.[questionNumber - 1].answer as string,
            answersQuiz?.[roundNumber]?.[questionNumber - 1].blitz as boolean,
            roundNumber,
            questionNumber,
            roundName
        );
    };

    const getShortenedAnswer = (answer: string) => {
        const maxLength = mediaMatch.matches ? 30 : 52;
        if (answer.length > maxLength) {
            return `${answer.substring(0, maxLength + 1)}\u2026`;
        }
        return `${answer}`;
    };

    const renderAnswerSnackbar = () => {
        return (
            <Snackbar
                open={flags.isSnackbarOpen}
                autoHideDuration={5000}
                onClose={handleClose}
                sx={{ marginTop: '8vh' }}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleClose} severity={flags.isAnswerAccepted ? 'success' : 'error'} sx={{ width: '100%' }}>
                    {flags.isAnswerAccepted ? 'Ответ успешно отправлен' : 'Не удалось отправить. Попробуйте еще раз'}
                </Alert>
            </Snackbar>
        );
    };

    const renderAnswerSnackbarQuiz = () => {
        return (
            <Snackbar
                open={flags.isSnackbarQuizOpen}
                autoHideDuration={5000}
                onClose={handleClose}
                sx={{ marginTop: '8vh' }}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleClose} severity={'error'} sx={{ width: '100%' }}>
                    {timeForAnswer ? 'Дождитесь начата тура' : 'Время на ответ закончилось'}
                </Alert>
            </Snackbar>
        );
    };

    const renderErrorSnackbar = () => {
        return (
            <Snackbar
                sx={{ marginTop: '8vh' }}
                open={isConnectionError}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                autoHideDuration={5000}
            >
                <Alert severity="error" sx={{ width: '100%' }}>
                    Пропало соединение. Обновите страницу
                </Alert>
            </Snackbar>
        );
    };

    const renderMatrix = () => {
        return matrixSettings?.roundNames?.map((tourName, i) => {
            return (
                <div className={classes.tourQuestionsWrapper} key={`${tourName}_${i}`}>
                    <div className={classes.tourName}>{tourName}</div>

                    {Array.from(Array(matrixSettings?.questionsCount).keys()).map(j => {
                        return (
                            <div
                                key={`matrix_question_${j}`}
                                style={{
                                    marginBottom:
                                        j === (matrixSettings?.questionsCount as number) - 1 &&
                                        i !== (matrixSettings?.roundNames?.length || 0) - 1
                                            ? mediaMatch.matches
                                                ? '2rem'
                                                : '2.5rem'
                                            : 0
                                }}
                            >
                                <div className={classes.matrixAnswerNumberWrapper}>
                                    <p className={classes.matrixAnswerNumber}>Вопрос за {j + 1}0</p>
                                    {acceptedAnswersMatrix?.[i + 1][j] ? (
                                        <small className={classes.accepted}>
                                            {'Ответ: '}
                                            <span className={classes.acceptedAnswer}>
                                                {getShortenedAnswer(acceptedAnswersMatrix?.[i + 1][j] as string)}
                                            </span>
                                        </small>
                                    ) : null}
                                </div>
                                <div className={classes.answerInputWrapper}>
                                    <Input
                                        type="text"
                                        id="answer"
                                        name="answer"
                                        placeholder="Ответ"
                                        style={{
                                            width: mediaMatch.matches ? '80%' : '',
                                            margin: mediaMatch.matches ? '0' : '0 1rem 0 0',
                                            border: '2px solid var(--color-text-icon-secondary)',
                                            borderRadius: '.5rem'
                                        }}
                                        value={answersMatrix?.[i + 1][j]}
                                        onChange={e => handleAnswer(e, GameType.matrix, j, i + 1)}
                                    />
                                    <div className={classes.answerButtonWrapper}>
                                        <button
                                            className={classes.sendAnswerButton}
                                            onClick={() => handleSendMatrixAnswer(j + 1, tourName, i + 1)}
                                        >
                                            <span className={classes.sendText}>Отправить</span>
                                            <SendRoundedIcon className={classes.sendIcon} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        });
    };

    const renderQuiz = () => {
        return (
            <div className={classes.tourQuestionsWrapper} key={`${activeRound.name}_${activeRound.number}`}>
                {Array.from(Array(quizSettings?.questionsCount).keys()).map(j => {
                    return (
                        <div
                            key={`quiz_question_${j}`}
                            style={{
                                marginBottom: 32
                            }}
                        >
                            <div className={classes.matrixAnswerNumberWrapper}>
                                <p className={classes.matrixAnswerNumber}>Вопрос {j + 1}</p>
                                {acceptedAnswersQuiz?.[activeRound.number][j].answer ? (
                                    <small className={classes.accepted}>
                                        {'Ответ: '}
                                        <span className={classes.acceptedAnswer}>
                                            {getShortenedAnswer(acceptedAnswersQuiz?.[activeRound.number][j].answer)}
                                        </span>
                                    </small>
                                ) : null}
                            </div>
                            <div className={`${classes.answerInputWrapper} ${classes.answerQuizInputWrapper}`}>
                                <Input
                                    type="text"
                                    id="answer"
                                    name="answer"
                                    placeholder="Ответ"
                                    style={{
                                        width: mediaMatch.matches ? '80%' : '',
                                        margin: mediaMatch.matches ? '0' : '0 1rem 0 0',
                                        border: '2px solid var(--color-text-icon-secondary)',
                                        borderRadius: '.5rem'
                                    }}
                                    value={answersQuiz?.[activeRound.number][j].answer}
                                    onChange={e => handleAnswer(e, GameType.quiz, j, activeRound.number)}
                                />
                                <div className={classes.answerButtonWrapper}>
                                    <button
                                        className={classes.sendAnswerButton}
                                        onClick={() => handleSendQuizAnswer(j + 1, activeRound.name, activeRound.number)}
                                    >
                                        <span className={classes.sendText}>Отправить</span>
                                        <SendRoundedIcon className={classes.sendIcon} />
                                    </button>
                                </div>
                            </div>
                            {quizSettings?.roundTypes &&
                                quizSettings?.roundTypes[activeRound.number - 1] === RoundType.BLITZ && (
                                    <CustomCheckbox
                                        label={'Точно правильный ответ'}
                                        onChange={e =>
                                            handleAnswer(
                                                e as React.ChangeEvent<HTMLInputElement>,
                                                GameType.quiz,
                                                j,
                                                activeRound.number
                                            )
                                        }
                                        checked={answersQuiz?.[activeRound.number][j].blitz || false}
                                    />
                                )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderChgk = () => {
        return (
            <div className={classes.formWrapper}>
                <div className={classes.answerInputWrapper}>
                    <Input
                        type="text"
                        id="answer"
                        name="answer"
                        placeholder="Ответ"
                        style={{
                            width: mediaMatch.matches ? '80%' : '',
                            margin: mediaMatch.matches ? '0' : '0 1rem 0 0',
                            border: '2px solid var(--color-text-icon-secondary)',
                            borderRadius: '.5rem'
                        }}
                        value={answerChgk}
                        onChange={e => handleAnswer(e, GameType.chgk, 0, 0)}
                    />
                    <div className={classes.answerButtonWrapper}>
                        <button className={classes.sendAnswerButton} onClick={handleSendChgkAnswer}>
                            <span className={classes.sendText}>Отправить</span>
                            <SendRoundedIcon className={classes.sendIcon} />
                        </button>
                    </div>
                </div>
                {acceptedAnswerChgk ? (
                    <small className={classes.accepted}>
                        {'Ответ: '}
                        <span className={classes.acceptedAnswer}>{getShortenedAnswer(acceptedAnswerChgk)}</span>
                    </small>
                ) : null}
            </div>
        );
    };

    const renderQuestionText = () => {
        if (activeQuestion.question) {
            return <div className={classes.questionText}>{activeQuestion.question}</div>;
        }
        return null;
    };

    const renderGamePart = () => {
        const width = Math.ceil(100 * (timeForAnswer / maxTime));

        if (gamePart === GameType.matrix) {
            return (
                <>
                    <div className={classes.teamWrapper}>
                        <div className={classes.team}>{'Играет команда'}</div>
                        <div className={classes.teamName}>{getTeamName()}</div>
                    </div>

                    <div className={classes.answersWrapper}>
                        <div className={classes.questionWrapper}>
                            <div className={classes.activeQuestionHeader}>
                                <div>Вопрос за {activeQuestion.number}0</div>
                                <div className={classes.matrixRoundName} style={{ maxWidth: '60%' }}>
                                    {activeRound.name}
                                </div>
                            </div>

                            {renderQuestionText()}

                            <div className={classes.leftTime} style={{ color: chooseColor(timeForAnswer, gamePart) }}>
                                Осталось: {Math.ceil(timeForAnswer ?? 0) >= 0 ? Math.ceil(timeForAnswer ?? 0) : 0} сек.
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '2%', minHeight: '10px' }}>
                            <div
                                className={classes.progressBar}
                                id="progress-bar"
                                style={{ width: width + '%', backgroundColor: chooseColor(timeForAnswer, gamePart) }}
                            />
                        </div>

                        <div className={classes.answersBox}>
                            <Scrollbar>{renderMatrix()}</Scrollbar>
                        </div>
                    </div>
                </>
            );
        }
        if (gamePart === GameType.quiz) {
            return (
                <>
                    <div className={classes.teamWrapper}>
                        <div className={classes.team}>{'Играет команда'}</div>
                        <div className={classes.teamName}>{getTeamName()}</div>
                    </div>

                    <div className={classes.answersWrapper}>
                        <div className={classes.questionWrapper}>
                            <div className={classes.activeQuestionHeader}>
                                <div>Вопрос {activeQuestion.number}</div>
                                <div className={classes.matrixRoundName} style={{ maxWidth: '60%' }}>
                                    {activeRound.name}
                                </div>
                            </div>

                            {renderQuestionText()}

                            <div className={classes.leftTime} style={{ color: chooseColor(timeForAnswer, gamePart) }}>
                                Осталось: {Math.ceil(timeForAnswer ?? 0) >= 0 ? Math.ceil(timeForAnswer ?? 0) : 0} сек.
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '2%', minHeight: '10px' }}>
                            <div
                                className={classes.progressBar}
                                id="progress-bar"
                                style={{ width: width + '%', backgroundColor: chooseColor(timeForAnswer, gamePart) }}
                            />
                        </div>

                        <div className={classes.answersBox}>
                            <Scrollbar>{renderQuiz()}</Scrollbar>
                        </div>
                    </div>
                </>
            );
        }
        if (gamePart === GameType.chgk) {
            return (
                <>
                    <div className={classes.teamWrapper}>
                        <div className={classes.team}>{'Играет команда'}</div>
                        <div className={classes.teamName}>{getTeamName()}</div>
                    </div>

                    <div className={classes.answersWrapper}>
                        <div className={classes.questionWrapper}>
                            <div className={classes.activeQuestionHeader}>{`Вопрос ${activeQuestion.number}`}</div>
                            {renderQuestionText()}
                            <div className={classes.leftTime} style={{ color: chooseColor(timeForAnswer, gamePart) }}>
                                Осталось: {Math.ceil(timeForAnswer ?? 0) >= 0 ? Math.ceil(timeForAnswer ?? 0) : 0} сек.
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '2%', minHeight: '10px' }}>
                            <div
                                className={classes.progressBar}
                                id="progress-bar"
                                style={{ width: width + '%', backgroundColor: chooseColor(timeForAnswer, gamePart) }}
                            />
                        </div>
                        <div className={classes.answerBox}>{renderChgk()} </div>
                    </div>
                </>
            );
        }
    };

    const renderPage = () => {
        if (!isGameStarted) {
            return (
                <PageWrapper>
                    <Header isAuthorized={true} isAdmin={false}>
                        {<div className={classes.gameName}>{gameName}</div>}
                    </Header>
                    {mediaMatch.matches ? <MobileNavbar isAdmin={false} page="" isGame={false} /> : null}
                    <div className={classes.gameStartContentWrapper}>
                        <img className={classes.image} src={readyOwlImage} alt="logo" />

                        <div className={classes.pageText}>Приготовьтесь!</div>
                        <div className={classes.pageText}>Вот-вот, и мы начнём</div>
                    </div>
                    {renderErrorSnackbar()}
                </PageWrapper>
            );
        }

        if (isBreak) {
            return (
                <PageWrapper>
                    <Header isAuthorized={true} isAdmin={false}>
                        {!mediaMatch.matches ? (
                            <>
                                <Link to={`/rating/${gameId}`} className={`${classes.menuLink} ${classes.ratingLink}`}>
                                    Рейтинг
                                </Link>
                                <Link to={`/game-answers/${gameId}`} className={`${classes.menuLink} ${classes.answersLink}`}>
                                    Ответы
                                </Link>
                            </>
                        ) : null}

                        <div className={classes.breakHeader}>{gameName}</div>
                    </Header>

                    {mediaMatch.matches ? (
                        <MobileNavbar isGame={true} isAdmin={false} page={''} toAnswers={true} gameId={gameId} />
                    ) : null}
                    <div className={classes.breakContentWrapper}>
                        <img className={classes.image} src={breakOwlImage} alt="logo" />
                        <div className={classes.breakTime}>
                            {parseTimer()}
                            <p className={classes.breakTimeText}>Отдохни, да выпей чаю</p>
                        </div>
                    </div>
                    {renderErrorSnackbar()}
                </PageWrapper>
            );
        }

        return (
            <PageWrapper>
                <Header isAuthorized={true} isAdmin={false}>
                    {!mediaMatch.matches ? (
                        <>
                            <Link to={`/rating/${gameId}`} className={`${classes.menuLink} ${classes.ratingLink}`}>
                                Рейтинг
                            </Link>
                            <Link to={`/game-answers/${gameId}`} className={`${classes.menuLink} ${classes.answersLink}`}>
                                Ответы
                            </Link>
                        </>
                    ) : null}

                    <div className={classes.gameName}>{gameName}</div>
                </Header>

                {mediaMatch.matches ? (
                    <MobileNavbar isGame={true} isAdmin={false} page="" toAnswers={true} gameId={gameId} />
                ) : null}
                <div className={classes.contentWrapper}>{renderGamePart()}</div>
                {renderErrorSnackbar()}
                {renderAnswerSnackbar()}
                {renderAnswerSnackbarQuiz()}
            </PageWrapper>
        );
    };

    return isLoading || !gameName ? <Loader /> : renderPage();
};

function mapStateToProps(state: AppState) {
    return {
        userTeam: state.appReducer.user.team
    };
}

export default connect(mapStateToProps)(UserGame);
