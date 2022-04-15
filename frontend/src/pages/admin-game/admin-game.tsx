import React, {FC, useEffect, useState} from 'react';
import classes from './admin-game.module.scss';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import Header from '../../components/header/header';
import {Link, useParams} from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import {AdminGameProps, TourProps} from '../../entities/admin-game/admin-game.interfaces';
import PauseIcon from '@mui/icons-material/Pause';
import CircleOutlinedIcon from '@mui/icons-material/Circle';
import {getGame} from '../../server-api/server-api';
import Scrollbar from '../../components/scrollbar/scrollbar';
import {getCookie, getUrlForSocket} from '../../commonFunctions';
import Modal from '../../components/modal/modal';
import Loader from '../../components/loader/loader';
import {Alert, Snackbar} from '@mui/material';

let interval: any;
let breakInterval: any;
let conn: WebSocket;
let ping: any;

const AdminGame: FC<AdminGameProps> = props => {
    const [playOrPause, setPlayOrPause] = useState<'play' | 'pause'>('play');
    const [chosenTourNumber, setChosenTourNumber] = useState<number>();
    const [activeTourNumber, setActiveTour] = useState<number | 'none'>();
    const [activeQuestionNumber, setActiveQuestion] = useState<number | 'none'>();
    const [toursCount, setToursCount] = useState<number>();
    const [questionsCount, setQuestionsCount] = useState<number>();
    const [gameName, setGameName] = useState<string>();
    const {gameId} = useParams<{ gameId: string }>();
    const [timer, setTimer] = useState<number>(70000);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [breakTime, setBreakTime] = useState<number>(0); // в секундах
    const [isBreak, setIsBreak] = useState<boolean>(false);
    const [isAppeal, setIsAppeal] = useState<boolean[]>([]);
    const [isConnectionError, setIsConnectionError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        getGame(gameId).then((res) => {
            if (res.status === 200) {
                res.json().then(({
                                     name,
                                     chgkSettings,
                                     matrixSettings
                                 }) => {
                    setGameName(name);
                    setToursCount(chgkSettings?.roundCount ?? 0);
                    setQuestionsCount(chgkSettings?.questionCount ?? 0);
                    setIsAppeal(new Array(chgkSettings ? chgkSettings.roundCount * chgkSettings.questionCount : 0).fill(false));
                });
            }
        });

        conn = new WebSocket(getUrlForSocket());

        conn.onopen = () => {
            conn.send(JSON.stringify({
                'cookie': getCookie('authorization'),
                'action': 'time'
            }));
            conn.send(JSON.stringify({
                'cookie': getCookie('authorization'),
                'action': 'getAllAppeals'
            }));
            conn.send(JSON.stringify({
                'cookie': getCookie('authorization'),
                'action': 'isOnBreak'
            }));
            conn.send(JSON.stringify({
                'cookie': getCookie('authorization'),
                'action': 'getQuestionNumber'
            }));

            ping = setInterval(() => {
                conn.send(JSON.stringify({
                    'action': 'ping'
                }));
            }, 30000);
        }

        conn.onclose = () => {
            setIsConnectionError(true);
        }

        conn.onerror = () => {
            setIsConnectionError(true);
        }

        conn.onmessage = function (event) {
            const jsonMessage = JSON.parse(event.data);
            if (jsonMessage.action === 'time') {
                setTimer(jsonMessage.time);
                if (jsonMessage.isStarted) {
                    setPlayOrPause('pause');
                    interval = setInterval(() => setTimer(t => {
                        let res = t - 1000;
                        if (res <= 0) {
                            clearInterval(interval);
                            setPlayOrPause('play');
                        }
                        return res > 0 ? res : 0;
                    }), 1000);
                }
            } else if (jsonMessage.action === 'appeal') {
                setIsAppeal(appeals => {
                    const appealsCopy = appeals.slice();
                    appealsCopy[jsonMessage.questionNumber - 1] = true;
                    return appealsCopy;
                })
            } else if (jsonMessage.action === 'appeals') {
                setIsAppeal(appeals => {
                    const appealsCopy = new Array(appeals.length).fill(false)
                    for (const number of jsonMessage.appealByQuestionNumber) {
                        appealsCopy[number - 1] = true;
                    }
                    return appealsCopy;
                })
            } else if (jsonMessage.action === 'isOnBreak') {
                if (jsonMessage.status) {
                    setIsBreak(true);
                    setBreakTime(jsonMessage.time);
                    breakInterval = setInterval(() => setBreakTime((time) => {
                        if (time - 1 <= 0) {
                            clearInterval(breakInterval);
                            setIsBreak(false);
                        }
                        return time - 1 > 0 ? time-1 : 0;
                    }), 1000)
                }
            } else if (jsonMessage.action == 'changeQuestionNumber') {
                setChosenTourNumber(jsonMessage.round);
                setActiveTour(jsonMessage.round);
                setActiveQuestion(jsonMessage.question);
                setIsLoading(false);
            }
        };

        return () => clearInterval(ping);
    }, []);

    const Tour: FC<TourProps> = props => {
        const handleTourClick = () => {
            setChosenTourNumber(() => {
                if (activeTourNumber === props.tourNumber) {
                    conn.send(JSON.stringify({
                        'cookie': getCookie('authorization'),
                        'action': 'getQuestionNumber'
                    }));
                }

                return props.tourNumber;
            });
            setActiveQuestion('none');
        };

        if (chosenTourNumber === undefined) {
            return null;
        }

        return (
            <div className={`${classes.tour} ${props.tourNumber === chosenTourNumber ? classes.activeTour : ''}`} id={`${props.tourNumber}`}
                 onClick={handleTourClick} key={`tour_${props.tourNumber}`}>
                <div style={{position: 'relative'}}>
                    {
                        typeof activeTourNumber === 'number' && props.tourNumber === activeTourNumber
                            ? <span style={{position: 'absolute', left: '-40%'}}>&#9654;</span>
                            : ''
                    }
                    Тур {props.tourNumber}
                </div>
            </div>
        );
    }

    const getGameName = () => {
        if ((gameName as string)?.length > 34) {
            return (gameName as string).substr(0, 34) + '\u2026';
        } else {
            return gameName;
        }
    }

    const parseTimer = (time:number) => {
        const minutes = Math.floor(time / 1000 / 60).toString().padStart(1, '0');
        const sec = Math.floor(time / 1000 % 60).toString().padStart(2, '0');
        return `${minutes}:${sec}`;
    };

    const handleQuestionClick = (event: React.SyntheticEvent) => {
        const activeQuestion = document.querySelector(`.${classes.activeQuestion}`) as HTMLDivElement;
        const clickedQuestion = event.target as HTMLDivElement;
        if (activeQuestion) {
            activeQuestion.classList.remove(classes.activeQuestion);
        }
        clickedQuestion.classList.add(classes.activeQuestion);
        setActiveQuestion(+clickedQuestion.id);
        setActiveTour(chosenTourNumber);

        conn.send(JSON.stringify({
            'cookie': getCookie('authorization'),
            'action': 'changeQuestion',
            'questionNumber': +clickedQuestion.id,
            'tourNumber': chosenTourNumber,
        }));

        handleStopClick(); // Прошлый вопрос остановится!
    };

    const handlePlayClick = () => {
        if (playOrPause === 'play') {
            conn.send(JSON.stringify({
                'cookie': getCookie('authorization'),
                'action': 'Start',
                'question': [activeTourNumber, activeQuestionNumber]
            }));
            setPlayOrPause('pause');
            interval = setInterval(() =>
                setTimer(t => {
                    let res = t - 1000;
                    if (res <= 0) {
                        clearInterval(interval);
                        setPlayOrPause('play');
                    }
                    return res > 0 ? res : 0;
                }), 1000);
        } else {
            clearInterval(interval);
            conn.send(JSON.stringify({
                'cookie': getCookie('authorization'),
                'action': 'Pause'
            }));
            setPlayOrPause('play');
        }
    };

    const handleStopClick = () => {
        setPlayOrPause('play');
        conn.send(JSON.stringify({
            'cookie': getCookie('authorization'),
            'action': 'Stop'
        }));
        clearInterval(interval);
        setTimer(70000);
    };

    const handleAddedTimeClick = () => {
        conn.send(JSON.stringify({
            'cookie': getCookie('authorization'),
            'action': '+10sec'
        }));
        setTimer(t => t + 10000);
    };

    const renderTours = () => {
        if (!activeTourNumber || !chosenTourNumber) {
            return null;
        }

        return Array.from(Array(toursCount).keys()).map(i => <Tour tourNumber={i + 1} />);
    };

    const renderQuestions = () => {
        if (!activeTourNumber || !activeQuestionNumber || !chosenTourNumber || !questionsCount) {
            return null;
        }

        return Array.from(Array(questionsCount).keys()).map(i => {
            return (
                <div className={classes.questionWrapper} key={`tour_${activeTourNumber}_question_${i + 1}`}>
                    <div className={`${classes.question} ${typeof activeQuestionNumber === 'number' && i === activeQuestionNumber - 1 ? classes.activeQuestion : ''}`} id={`${i + 1}`}
                         onClick={handleQuestionClick}>
                        Вопрос {i + 1}
                    </div>

                    <Link className={classes.answersButtonLink}
                          to={`/admin/game/${gameId}/answers/${chosenTourNumber}/${i + 1}`}>
                        <button className={`${classes.button} ${classes.answersButton}`}>
                            Ответы
                            {
                                isAppeal[(chosenTourNumber - 1) * questionsCount + i]
                                    ?
                                    <div className={classes.opposition}>
                                        <CircleOutlinedIcon sx={{
                                            fill: 'red',
                                            fontSize: '1.2vw',
                                            color: 'darkred',
                                            userSelect: 'none',
                                            pointerEvents: 'none'
                                        }}/>
                                    </div>
                                    : null
                            }
                        </button>
                    </Link>
                </div>
            );
        });
    };

    const openBreakModal = () => {
        setIsModalOpen(true);
    };

    const stopBreak = () => {
        setBreakTime(0);
        setIsBreak(false);
        clearInterval(breakInterval);
        conn.send(JSON.stringify({
            'cookie': getCookie('authorization'),
            'action': 'stopBreak'
        }))
    }

    if (isLoading || !gameName) {
        return <Loader />;
    }

    return (
        <PageWrapper>
            <Header isAuthorized={true} isAdmin={true}>
                <Link to={`/admin/rating/${gameId}`} className={classes.menuLink}>Рейтинг</Link>

                <div className={classes.gameName}>
                    <p>{getGameName()}</p>
                </div>
            </Header>

            {
                isModalOpen
                    ? <Modal modalType='break' closeModal={setIsModalOpen} startBreak={setIsBreak}
                             setBreakTime={setBreakTime}/>
                    : null
            }

            <div className={classes.contentWrapper}>
                <div className={classes.buttonsWrapper}>
                    <button className={`${classes.button} ${classes.breakButton}`}
                            onClick={isBreak ? stopBreak : openBreakModal}>{isBreak ? 'Остановить перерыв' : 'Перерыв'}</button>

                    <button className={`${classes.button} ${classes.playButton}`} disabled={isBreak} onClick={handlePlayClick}>
                        {playOrPause === 'play'
                            ? <PlayArrowIcon sx={{fontSize: '2.5vw', color: 'black'}}/>
                            : <PauseIcon sx={{fontSize: '2.5vw', color: 'black'}}/>
                        }
                    </button>

                    <button className={`${classes.button} ${classes.stopButton}`} disabled={isBreak} onClick={handleStopClick}>
                        <StopIcon sx={{fontSize: '2.5vw', color: 'black'}}/>
                    </button>

                    <button className={`${classes.button} ${classes.tenSecondsButton}`} disabled={isBreak} onClick={handleAddedTimeClick}>+
                        10 сек.
                    </button>

                    <div className={classes.answerTime}>{parseTimer(timer)}</div>
                </div>

                <div className={classes.tablesWrapper}>
                    <div className={classes.toursWrapper}>
                        <Scrollbar>
                            {activeTourNumber ? renderTours() : null}
                        </Scrollbar>
                    </div>

                    <div className={classes.questionsWrapper}>
                        <Scrollbar>
                            {activeQuestionNumber ? renderQuestions() : null}
                        </Scrollbar>
                    </div>
                </div>
                {
                    isBreak
                        ? <p className={classes.breakInformer}>Идет перерыв: <b>{parseTimer(breakTime*1000)}</b></p>
                        : null
                }
            </div>
            <Snackbar sx={{marginTop: '8vh'}} open={isConnectionError} anchorOrigin={{vertical: 'top', horizontal: 'right'}} autoHideDuration={5000}>
                <Alert severity='error' sx={{width: '100%'}}>
                    Ошибка соединения. Обновите страницу
                </Alert>
            </Snackbar>
        </PageWrapper>
    );
};

export default AdminGame;