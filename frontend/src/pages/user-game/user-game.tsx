import React, {ChangeEvent, useEffect, useState} from 'react';
import classes from './user-game.module.scss';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import Header from '../../components/header/header';
import {Link, useParams} from 'react-router-dom';
import {Alert, Snackbar} from '@mui/material';
import {UserGameProps} from '../../entities/user-game/user-game.interfaces';
import {getCookie, getUrlForSocket} from '../../commonFunctions';
import Loader from '../../components/loader/loader';
import {AppState} from '../../entities/app/app.interfaces';
import {connect} from 'react-redux';
import MobileNavbar from '../../components/mobile-navbar/mobile-navbar';
import Scrollbar from '../../components/scrollbar/scrollbar';
import {Input} from "../../components/input/input";
import readyOwlImage from '../../images/owl-images/ready-owl.svg';
import breakOwlImage from '../../images/owl-images/break_owl.svg';
import {GamePartSettings} from "../../server-api/type";
import {ServerApi} from "../../server-api/server-api";

let progressBarInterval: any;
let interval: any;
let checkStart: any;
let ping: any;
let conn: WebSocket;
let matrixSettingsCurrent: GamePartSettings | undefined;

export enum GameType {
    chgk = 'chgk',
    matrix = 'matrix'
}

const UserGame: React.FC<UserGameProps> = props => {
    const {gameId} = useParams<{ gameId: string }>();
    const [answer, setAnswer] = useState<string>('');
    const [gameName, setGameName] = useState<string>();
    const [questionNumber, setQuestionNumber] = useState<number>(1);
    const [timeForAnswer, setTimeForAnswer] = useState<number>(70);
    const [maxTime, setMaxTime] = useState<number>(70);
    const [flags, setFlags] = useState<{
        isSnackbarOpen: boolean,
        isAnswerAccepted: boolean
    }>({
        isSnackbarOpen: false,
        isAnswerAccepted: false
    });
    const [isBreak, setIsBreak] = useState<boolean>(false);
    const [breakTime, setBreakTime] = useState<number>(0);
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [isConnectionError, setIsConnectionError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [gamePart, setGamePart] = useState<GameType>(); // активная часть игры
    const [matrixAnswers, setMatrixAnswers] = useState<{ [key: number]: string[] } | null>(null); // Заполнить там же, где matrixSettings, вызвав fillMatrixAnswers(tourNames, questionsCount)
    const [acceptedMatrixAnswers, setAcceptedMatrixAnswers] = useState<{ [key: number]: string[] } | null>(null); // Заполнить там же, где matrixSettings, вызвав fillMatrixAnswers(tourNames, questionsCount)
    const [acceptedAnswer, setAcceptedAnswer] = useState<string | undefined>();
    const [mediaMatch, setMediaMatch] = useState<MediaQueryList>(window.matchMedia('(max-width: 600px)'));
    const [activeMatrixRound, setActiveMatrixRound] = useState<{ name: string, index: number }>();
    const [activeMatrixQuestion, setActiveMatrixQuestion] = useState<number>(1);
    const [focusedMatrixAnswerInfo, setFocusedMatrixAnswerInfo] = useState<{ index: number, roundName: string, roundNumber: number }>();
    const [currentQuestion, setCurrentQuestion] = useState<string>('');

    const requester = {
        getPayload: (obj: any) => JSON.stringify({
            'cookie': getCookie('authorization'),
            'gameId': gameId,
            ...obj,
        }),

        startRequests: () => {
            conn.send(requester.getPayload({ 'action': 'checkStart' }));
            requester.getTeamAnswers();
            clearInterval(checkStart);
            checkStart = setInterval(() => {
                if (!isGameStarted) {
                    conn.send(requester.getPayload({ 'action': 'checkStart' }));
                } else {
                    clearInterval(checkStart);
                }
            }, 5000);

            clearInterval(ping);
            ping = setInterval(() => {
                conn.send(JSON.stringify({ 'action': 'ping' }));
            }, 30000);
        },

        checkBreak: () => {
            conn.send(requester.getPayload({ 'action': 'isOnBreak' }));
        },

        getQuestionTime: () => {
            conn.send(requester.getPayload({ 'action': 'time' }));
        },

        checkTime: () => {
            conn.send(requester.getPayload({ 'action': 'checkTime' }))
        },

        giveAnswerToChgk: (answer: string) => {
            conn.send(requester.getPayload({
                'action': 'Answer',
                'answer': answer
            }));
        },

        giveAnswerToMatrix: (answer: string, roundNumber: number, questionNumber: number, roundName: string) => {
            conn.send(requester.getPayload({
                'action': 'Answer',
                'answer': answer,
                'roundNumber': roundNumber,
                'questionNumber': questionNumber,
                'roundName': roundName,
            }));
        },

        getTeamAnswers: () => {
            conn.send(requester.getPayload({ 'action': 'getTeamAnswers' }));
        },

        checkBreakTime: (time: number) => {
            conn.send(requester.getPayload({
                'action': 'checkBreakTime',
                'time': time,
            }))
        },
    }

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
            questionNumber: number,
            matrixActive: { round: number, question: number },
            maxTime: number,
            time: number,
            text: string,
        ) => {
            if (isStarted) {
                setGamePart(gamePart);
                setIsGameStarted(true);
                clearInterval(checkStart);
                clearInterval(interval);
                setQuestionNumber(questionNumber);
                setCurrentQuestion(text);
                if (gamePart === GameType.matrix) {
                    const matrixRoundName = matrixSettingsCurrent?.roundNames?.[matrixActive.round - 1];
                    if (matrixRoundName) {
                        setActiveMatrixRound({name: matrixRoundName, index: matrixActive.round});
                    }
                    setActiveMatrixQuestion(matrixActive.question);
                }
                setTimeForAnswer(time / 1000);
                setMaxTime(maxTime / 1000);
                if (isOnBreak) {
                    setIsBreak(true);
                    setBreakTime(breakTime);
                    interval = setInterval(() => setBreakTime((time) => {
                        requester.checkBreakTime(time);
                        if (time - 1 <= 0) {
                            clearInterval(interval);
                            setIsBreak(false);
                        }
                        return time - 1 > 0 ? time - 1 : 0;
                    }), 1000);
                }

                setIsLoading(false);
                requester.getQuestionTime();
            } else {
                setIsLoading(false);
            }
        },

        handleGetTeamAnswers: (matrixAnswers: { roundNumber: number, questionNumber: number, answer: string }[]) => {
            setAcceptedMatrixAnswers((prevValue) => {
                const copy = prevValue ? {...prevValue} : {};
                if (!matrixAnswers) {
                    return copy;
                }

                for (const answer of matrixAnswers) {
                    copy[answer.roundNumber][answer.questionNumber - 1] = answer.answer;
                }
                return copy;
            });
        },

        handleTimeMessage: (time: number, maxTime: number, isStarted: boolean, gamePart: GameType) => {
            setTimeForAnswer(() => {
                const progress = document.querySelector('#progress-bar') as HTMLDivElement;
                const width = Math.ceil(100 * time / maxTime);
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
                progressBarInterval = moveProgressBar();
            }
            setMaxTime(maxTime / 1000);
        },

        handleCheckTimeMessage: (time: number, maxTime: number, gamePart: GameType) => {
            const progressBar = document.querySelector('#progress-bar') as HTMLDivElement;
            if (!progressBar || time == 0) {
                clearInterval(progressBarInterval);
            }

            const width = Math.ceil(100 * time / maxTime);
            progressBar.style.width = width + '%';
            changeColor(progressBar, gamePart, Math.round(time / 1000));

            const newTime = Math.round(time / 1000)
            setTimeForAnswer(newTime);
            setMaxTime(Math.round(maxTime / 1000));
        },

        handleCheckBreakTimeMessage: (time: number) => {
            setBreakTime(time);
        },

        handleStartMessage: (time: number, maxTime: number) => {
            setTimeForAnswer(time / 1000);
            clearInterval(progressBarInterval);
            progressBarInterval = moveProgressBar();
            setMaxTime(maxTime / 1000);
        },

        handleAddTimeMessage: (maxTime: number, isStarted: boolean) => {
            clearInterval(progressBarInterval);
            setTimeForAnswer(t => (t ?? 0) + 10);
            if (isStarted) {
                clearInterval(progressBarInterval);
                progressBarInterval = moveProgressBar();
            }
            setMaxTime(maxTime / 1000);
        },

        handlePauseMessage: () => {
            clearInterval(progressBarInterval);
        },

        handleStopMessage: (gamePart: GameType) => {
            clearInterval(progressBarInterval);
            setTimeForAnswer(gamePart === GameType.chgk ? 70 : 20);
            let progress = document.querySelector('#progress-bar') as HTMLDivElement;
            if (progress) {
                progress.style.width = '100%';
                changeColor(progress, gamePart, gamePart === GameType.chgk ? 70 : 20);
            }
        },

        handleChangeQuestionNumberMessage: (
            gamePart: GameType,
            number: number,
            matrixActive: { round: number, question: number },
            text: string,
        ) => {
            clearInterval(progressBarInterval);
            setAnswer('');
            let progress = document.querySelector('#progress-bar') as HTMLDivElement;
            if (progress) {
                progress.style.width = '100%';
            }
            let answerInput = document.querySelector('#answer') as HTMLInputElement;
            if (answerInput && gamePart === GameType.chgk) {
                answerInput.focus();
            }
            changeColor(progress, gamePart, gamePart === GameType.chgk ? 70 : 20);
            setTimeForAnswer(gamePart === GameType.chgk ? 70 : 20);
            setMaxTime(gamePart === GameType.chgk ? 70 : 20);
            if (number != questionNumber) {
                setAcceptedAnswer(undefined);
            }
            setQuestionNumber(number);
            setCurrentQuestion(text);
            if (gamePart === GameType.matrix) {
                const matrixRoundName = matrixSettingsCurrent?.roundNames?.[matrixActive.round - 1];
                if (matrixRoundName) {
                    setActiveMatrixRound({ name: matrixRoundName, index: matrixActive.round });
                }
                setActiveMatrixQuestion(matrixActive.question);
            }
            setGamePart(gamePart);
        },

        handleCurrentQuestionNumberMessage: (gamePart: GameType, questionNumber: number, matrixActive: { round: number, question: number }) => {
            setQuestionNumber(questionNumber);
            if (gamePart === GameType.matrix) {
                const matrixRoundName = matrixSettingsCurrent?.roundNames?.[matrixActive.round - 1];
                if (matrixRoundName) {
                    setActiveMatrixRound({name: matrixRoundName, index: matrixActive.round});
                }
                setActiveMatrixQuestion(matrixActive.question);
            }
            setGamePart(gamePart);
        },

        handleStatusAnswerMessage: (gamePart: GameType, newAnswer: string, roundNumber: number, questionNumber: number, isAccepted: boolean) => {
            if (gamePart === GameType.chgk) {
                setAcceptedAnswer(newAnswer);
            } else {
                setAcceptedMatrixAnswers((prevValue) => {
                    const copy = {...prevValue};
                    copy[roundNumber] = copy[roundNumber].map((answer, i) => i === questionNumber - 1 ? newAnswer : answer);
                    return copy;
                });
            }

            if (isAccepted) {
                setFlags({
                    isAnswerAccepted: true,
                    isSnackbarOpen: true
                });
            } else {
                setFlags({
                    isAnswerAccepted: false,
                    isSnackbarOpen: true
                });
            }
            setTimeout(() => setFlags(flags => ({
                    isSnackbarOpen: false,
                    isAnswerAccepted: flags.isAnswerAccepted
                }
            )), 5000);
        },

        handleIsOnBreakMessage: (status: boolean, time: number) => {
            if (status) {
                setIsBreak(true);
                setBreakTime(time);
                clearInterval(interval);
                interval = setInterval(() => setBreakTime((time) => {
                    requester.checkBreakTime(time);
                    if (time - 1 <= 0) {
                        clearInterval(interval);
                        setIsBreak(false);
                    }
                    return time - 1 > 0 ? time - 1 : 0;
                }), 1000);
            } else {
                clearInterval(interval);
                setIsBreak(false);
                setBreakTime(0);
            }

            if (isLoading) {
                setIsLoading(false);
            }
        }
    }

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
        const enterEventHandler = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                if (gamePart === GameType.matrix) {
                    if (focusedMatrixAnswerInfo) {
                        handleSendMatrixAnswer(focusedMatrixAnswerInfo.index, focusedMatrixAnswerInfo.roundName, focusedMatrixAnswerInfo.roundNumber);
                    }
                } else if (gamePart === GameType.chgk) {
                    handleSendButtonClick();
                }
            }
        };

        window.addEventListener('keypress', enterEventHandler);

        return () => {
            window.removeEventListener('keypress', enterEventHandler);
        };
    }, [answer, focusedMatrixAnswerInfo, gamePart, matrixAnswers, acceptedMatrixAnswers, acceptedAnswer, flags]);

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
                        handler.handleGameStatusMessage(jsonMessage.isStarted, jsonMessage.activeGamePart,
                            jsonMessage.isOnBreak, jsonMessage.breakTime, jsonMessage.currentQuestionNumber,
                            jsonMessage.matrixActive, jsonMessage.maxTime, jsonMessage.time, jsonMessage.text);
                        break;
                    case 'time':
                        handler.handleTimeMessage(jsonMessage.time, jsonMessage.maxTime, jsonMessage.isStarted, jsonMessage.gamePart);
                        break;
                    case 'checkTime':
                        handler.handleCheckTimeMessage(jsonMessage.time, jsonMessage.maxTime, jsonMessage.gamePart);
                        break;
                    case 'start':
                        handler.handleStartMessage(jsonMessage.time, jsonMessage.maxTime);
                        break;
                    case 'addTime':
                        handler.handleAddTimeMessage(jsonMessage.maxTime, jsonMessage.isStarted); // TODO shusharin jsonMessage.time не используется
                        break;
                    case 'pause':
                        handler.handlePauseMessage();
                        break;
                    case 'stop':
                        handler.handleStopMessage(jsonMessage.activeGamePart);
                        break;
                    case 'changeQuestionNumber':
                        handler.handleChangeQuestionNumberMessage(
                            jsonMessage.activeGamePart,
                            jsonMessage.number,
                            jsonMessage.matrixActive,
                            jsonMessage.text,
                        );
                        break;
                    case 'currentQuestionNumber':
                        handler.handleCurrentQuestionNumberMessage(jsonMessage.activeGamePart, jsonMessage.number, jsonMessage.matrixActive);
                        break;
                    case 'statusAnswer':
                        handler.handleStatusAnswerMessage(jsonMessage.activeGamePart, jsonMessage.answer,
                            jsonMessage.roundNumber, jsonMessage.questionNumber, jsonMessage.isAccepted);
                        break;
                    case 'isOnBreak':
                        handler.handleIsOnBreakMessage(jsonMessage.status, jsonMessage.time);
                        break;
                    case 'teamAnswers':
                        handler.handleGetTeamAnswers(jsonMessage.matrixAnswers);
                        break;
                    case 'checkBreakTime':
                        handler.handleCheckBreakTimeMessage(jsonMessage.time); // TODO передается лишний jsonMessage.currentTime
                        break;
                }
            }
        };

        ServerApi.getGame(gameId).then((res) => {
            if (res.status === 200) {
                res.json().then(({
                                     name, // TODO shusharin почему chgkSettings не используются?
                                     matrixSettings
                                 }) => {
                    setGameName(name);
                    matrixSettingsCurrent = undefined;
                    if (matrixSettings) {
                        matrixSettingsCurrent = matrixSettings;
                        fillMatrixAnswers(matrixSettings.roundsCount, matrixSettings.questionsCount);
                    }

                    openWs();
                });
            }
        });

        return () => clearInterval(ping);
    }, []);

    const fillMatrixAnswers = (roundsCount: number, questionsCount: number) => {
        const answers: { [key: number]: string[] } = {};
        for (let i = 1; i <= roundsCount; i++) {
            answers[i] = Array(questionsCount).fill('');
        }
        setMatrixAnswers(answers);
        setAcceptedMatrixAnswers(answers);
    };

    const getTeamName = () => {
        const teamName = props.userTeam;
        const maxLength = mediaMatch.matches ? 25 : 45;
        if (teamName.length > maxLength) {
            return teamName.substring(0, maxLength + 1) + '\u2026';
        }
        return teamName;
    }

    const parseTimer = () => {
        const minutes = Math.floor(breakTime / 60).toString().padStart(1, '0');
        const sec = Math.floor(breakTime % 60).toString().padStart(2, '0');
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
        const redTime = (gamePart === GameType.chgk ? 10 : 5);
        const yellowTime = (gamePart === GameType.chgk ? 20 : 10);
        switch (true) {
            case (time <= redTime): // 10-0, 5-0
                return 'var(--color-fill-progressBar-red)';
            case (redTime < time && time <= yellowTime): // 35-11, 10-6
                return 'var(--color-fill-progressBar-yellow)';
        }
        return 'var(--color-fill-progressBar-green)';  // 70-36, 20-11
    }

    const moveProgressBar = () => {
        return setInterval(() => requester.checkTime(), 1000);
    };

    const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setFlags(flags => ({
                isSnackbarOpen: false,
                isAnswerAccepted: flags.isAnswerAccepted
            }
        ));
    };

    const handleAnswer = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAnswer(event.target.value);
    };

    const handleSendButtonClick = () => {
        requester.giveAnswerToChgk(answer);

        setTimeout(() => {
            setFlags(flags => {
               if (!flags.isSnackbarOpen) {
                   return {
                       isSnackbarOpen: true,
                       isAnswerAccepted: false
                   };
               }

               return flags;
            });

            setTimeout(() => setFlags(flags => ({
                isSnackbarOpen: false,
                isAnswerAccepted: flags.isAnswerAccepted
            })), 5000);
        }, 1500);
    };

    const handleMatrixAnswer = (event: ChangeEvent<HTMLInputElement>, index: number, roundNumber: number) => {
        setMatrixAnswers((prevValue) => {
            const copy = {...prevValue};
            copy[roundNumber] = copy[roundNumber].map((answer, i) => i === index ? event.target.value : answer);
            return copy;
        });
    };

    const handleSendMatrixAnswer = (questionNumber: number, roundName: string, roundNumber: number) => {
        requester.giveAnswerToMatrix(matrixAnswers?.[roundNumber]?.[questionNumber - 1] as string, roundNumber, questionNumber, roundName);

        setTimeout(() => {
            setFlags(flags => {
                if (!flags.isSnackbarOpen) {
                    return {
                        isSnackbarOpen: true,
                        isAnswerAccepted: false
                    };
                }

                return flags;
            });

            setTimeout(() => setFlags(flags => ({
                isSnackbarOpen: false,
                isAnswerAccepted: flags.isAnswerAccepted
            })), 5000);
        }, 1500);
    };

    const getShortenedAnswer = (answer: string) => {
        const maxLength = mediaMatch.matches ? 30 : 52;
        if (answer.length > maxLength) {
            return `${answer.substring(0, maxLength + 1)}\u2026`;
        }
        return `${answer}`;
    };

    const renderAnswerSnackbar = () => {
        return(
            <Snackbar open={flags.isSnackbarOpen} autoHideDuration={5000} onClose={handleClose}
                      sx={{marginTop: '8vh'}}
                      anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
                <Alert onClose={handleClose}
                       severity={flags.isAnswerAccepted ? 'success' : 'error'}
                       sx={{width: '100%'}}
                >
                    {
                        flags.isAnswerAccepted
                            ? 'Ответ успешно отправлен'
                            : 'Не удалось отправить. Попробуйте еще раз'
                    }
                </Alert>
            </Snackbar>
        );
    }

    const renderErrorSnackbar = () => {
        return(
            <Snackbar sx={{marginTop: '8vh'}} open={isConnectionError}
                      anchorOrigin={{vertical: 'top', horizontal: 'right'}} autoHideDuration={5000}>
                <Alert severity="error" sx={{width: '100%'}}>
                    Пропало соединение. Обновите страницу
                </Alert>
            </Snackbar>
        );
    }

    const renderMatrix = () => {
        return matrixSettingsCurrent?.roundNames?.map((tourName, i) => {
            return (
                <div className={classes.tourQuestionsWrapper} key={`${tourName}_${i}`}>
                    <div className={classes.tourName}>{tourName}</div>

                    {
                        Array.from(Array(matrixSettingsCurrent?.questionsCount).keys()).map((j) => {
                            return (
                                <div key={`matrix_question_${j}`}
                                     style={{
                                         marginBottom: j === (matrixSettingsCurrent?.questionsCount as number) - 1 && i !== ((matrixSettingsCurrent?.roundNames?.length || 0) - 1)
                                             ? (mediaMatch.matches ? '2rem' : '2.5rem')
                                             : 0
                                     }}
                                >
                                    <div className={classes.matrixAnswerNumberWrapper}>
                                        <p className={classes.matrixAnswerNumber}>Вопрос за {j + 1}0</p>
                                        {
                                            acceptedMatrixAnswers?.[i + 1][j]
                                                ?
                                                <small className={classes.accepted}>{'Ответ: '}
                                                    <span className={classes.acceptedAnswer}>
                                                        {getShortenedAnswer(acceptedMatrixAnswers?.[i + 1][j] as string)}
                                                    </span>
                                                </small>
                                                : null
                                        }
                                    </div>
                                    <div className={classes.answerInputWrapper}>
                                        <Input type="text" id="answer" name="answer" placeholder="Ответ"
                                                     style={{
                                                         width: mediaMatch.matches ? '80%' : '',
                                                         margin: mediaMatch.matches ? '0' : '0 1rem 0 0',
                                                         border: '2px solid var(--color-text-icon-secondary)',
                                                         borderRadius: '.5rem'
                                                     }} value={matrixAnswers?.[i + 1][j]}
                                                     onFocus={() => setFocusedMatrixAnswerInfo({
                                                         index: j + 1,
                                                         roundName: tourName,
                                                         roundNumber: i + 1
                                                     })}
                                                     onChange={(event) => handleMatrixAnswer(event, j, i + 1)}
                                        />
                                        <div className={classes.answerButtonWrapper}>
                                            <button className={classes.sendAnswerButton}
                                                    onClick={() => handleSendMatrixAnswer(j + 1, tourName, i + 1)}
                                            >
                                                <span className={classes.sendText}>Отправить</span>
                                                <SendRoundedIcon className={classes.sendIcon}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            );
                        })
                    }
                </div>
            );
        });
    };

    const renderQuestionText = () => {
        if (currentQuestion) {
            return (
                <div className={classes.questionText}>
                    {currentQuestion}
                </div>
            );
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
                                <div>Вопрос за {activeMatrixQuestion}0</div>
                                <div className={classes.matrixRoundName}
                                     style={{maxWidth: '60%'}}
                                >
                                    {activeMatrixRound?.name}
                                </div>
                            </div>
                            {
                                renderQuestionText()
                            }
                            <div className={classes.leftTime}
                                 style={{color: chooseColor(timeForAnswer, gamePart)}}
                            >
                                Осталось: {Math.ceil(timeForAnswer ?? 0) >= 0 ? Math.ceil(timeForAnswer ?? 0) : 0} сек.
                            </div>
                        </div>

                        <div style={{width: '100%', height: '2%', minHeight: '10px'}}>
                            <div className={classes.progressBar} id="progress-bar"
                                 style={{width: width + '%', backgroundColor: chooseColor(timeForAnswer, gamePart)}}/>
                        </div>

                        <div className={classes.answersBox}>
                            <Scrollbar>
                                {renderMatrix()}
                            </Scrollbar>
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
                            <div className={classes.activeQuestionHeader}>{`Вопрос ${questionNumber}`}</div>
                            {
                                renderQuestionText()
                            }
                            <div className={classes.leftTime}
                                 style={{color: chooseColor(timeForAnswer, gamePart)}}
                            >
                                Осталось: {Math.ceil(timeForAnswer ?? 0) >= 0 ? Math.ceil(timeForAnswer ?? 0) : 0} сек.
                            </div>
                        </div>

                        <div style={{width: '100%', height: '2%', minHeight: '10px'}}>
                            <div className={classes.progressBar} id="progress-bar"
                                 style={{width: width + '%', backgroundColor: chooseColor(timeForAnswer, gamePart)}}/>
                        </div>
                        <div className={classes.answerBox}>
                            <div className={classes.formWrapper}>
                                <div className={classes.answerInputWrapper}>
                                    <Input type="text" id="answer" name="answer" placeholder="Ответ"
                                           style={{
                                               width: mediaMatch.matches ? '80%' : '',
                                               margin: mediaMatch.matches ? '0' : '0 1rem 0 0',
                                               border: '2px solid var(--color-text-icon-secondary)',
                                               borderRadius: '.5rem'
                                           }}
                                           value={answer}
                                           onChange={handleAnswer}
                                    />
                                    <div className={classes.answerButtonWrapper}>
                                        <button className={classes.sendAnswerButton}
                                                onClick={handleSendButtonClick}><span
                                            className={classes.sendText}>Отправить</span>
                                            <SendRoundedIcon className={classes.sendIcon}/>
                                        </button>
                                    </div>
                                </div>
                                {
                                    acceptedAnswer
                                        ?
                                        <small className={classes.accepted}>{'Ответ: '}
                                            <span className={classes.acceptedAnswer}>
                                                    {
                                                        getShortenedAnswer(acceptedAnswer)
                                                    }
                                                </span>
                                        </small>
                                        : null
                                }
                            </div>
                        </div>
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
                        {
                            <div className={classes.gameName}>
                                {gameName}
                            </div>
                        }
                    </Header>
                    {
                        mediaMatch.matches
                            ? <MobileNavbar isAdmin={false} page="" isGame={false}/>
                            : null
                    }
                    <div className={classes.gameStartContentWrapper}>
                        <img className={classes.image} src={readyOwlImage} alt="logo"/>

                        <div className={classes.pageText}>Приготовьтесь!</div>
                        <div className={classes.pageText}>Вот-вот, и мы начнём</div>
                    </div>
                    { renderErrorSnackbar() }
                </PageWrapper>
            )
        }

        if (isBreak) {
            return (
                <PageWrapper>
                    <Header isAuthorized={true} isAdmin={false}>

                        {
                            !mediaMatch.matches
                                ?
                                <>
                                    <Link to={`/rating/${gameId}`}
                                          className={`${classes.menuLink} ${classes.ratingLink}`}>Рейтинг</Link>
                                    <Link to={`/game-answers/${gameId}`}
                                          className={`${classes.menuLink} ${classes.answersLink}`}>Ответы</Link>
                                </>
                                : null
                        }

                        <div className={classes.breakHeader}>{gameName}</div>
                    </Header>

                    {
                        mediaMatch.matches
                            ? <MobileNavbar isGame={true} isAdmin={false} page={''} toAnswers={true} gameId={gameId}/>
                            : null
                    }
                    <div className={classes.breakContentWrapper}>
                        <img className={classes.image} src={breakOwlImage} alt="logo"/>
                        <div className={classes.breakTime}>
                            {parseTimer()}
                            <p className={classes.breakTimeText}>Отдохни да выпей чаю</p>
                        </div>
                    </div>
                    { renderErrorSnackbar() }
                </PageWrapper>
            );
        }

        return (
            <PageWrapper>
                <Header isAuthorized={true} isAdmin={false}>
                    {
                        !mediaMatch.matches
                            ?
                            <>
                                <Link to={`/rating/${gameId}`}
                                      className={`${classes.menuLink} ${classes.ratingLink}`}>Рейтинг</Link>
                                <Link to={`/game-answers/${gameId}`}
                                      className={`${classes.menuLink} ${classes.answersLink}`}>Ответы</Link>
                            </>
                            : null
                    }

                    <div className={classes.gameName}>
                        {gameName}
                    </div>
                </Header>

                {
                    mediaMatch.matches
                        ? <MobileNavbar isGame={true} isAdmin={false} page="" toAnswers={true} gameId={gameId}/>
                        : null
                }
                <div className={classes.contentWrapper}>
                    { renderGamePart() }
                </div>
                { renderErrorSnackbar() }
                { renderAnswerSnackbar() }
            </PageWrapper>
        );
    }

    return isLoading || !gameName
        ? <Loader/>
        : renderPage();
};

function mapStateToProps(state: AppState) {
    return {
        userTeam: state.appReducer.user.team
    };
}

export default connect(mapStateToProps)(UserGame);
