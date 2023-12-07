import React, { FC, useCallback, useEffect, useState } from 'react';
import classes from './admin-game.module.scss';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import Header from '../../components/header/header';
import { Link, useParams } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { AdminGameProps, TourProps } from '../../entities/admin-game/admin-game.interfaces';
import PauseIcon from '@mui/icons-material/Pause';
import { GamePartSettings, ServerApi } from '../../server-api/server-api';
import { getCookie, getUrlForSocket } from '../../commonFunctions';
import Modal, { OperationName } from '../../components/modal/modal';
import Loader from '../../components/loader/loader';
import { Alert, Divider, Snackbar } from '@mui/material';
import { Scrollbars } from 'rc-scrollbars';
import TimeWidget from '../../components/timeWidget/timeWidget';
import { AddRounded, BarChartRounded, CircleRounded, ExitToApp } from '@mui/icons-material';
import Button from '../../components/button/button.tsx';
import classesButton from '../../components/button/button.module.scss';
import { TypeButton } from '../../entities/custom-button/custom-button.interfaces.ts';

let interval: any;
let breakInterval: any;
let conn: WebSocket;
let ping: any;

const AdminGame: FC<AdminGameProps> = () => {
    const [playOrPause, setPlayOrPause] = useState<'play' | 'pause'>('play');

    const [clickedTourIndex, setClickedTourIndex] = useState<number>(1); // Тур, на который жмякнули
    const [clickedGamePart, setClickedGamePart] = useState<'matrix' | 'chgk'>(); // Часть игры, на тур которой жмякнули (чтобы перерисовать количество вопросов)
    const [activeTourIndex, setActiveTour] = useState<number | undefined>(1); // Индекс активного тура активной части игры
    const [activeGamePart, setActiveGamePart] = useState<'chgk' | 'matrix'>(); // Активная часть игры
    const [activeQuestionNumber, setActiveQuestion] = useState<number | undefined>(undefined); // Индекс активного вопроса в активном туре активной части игры

    const [chgkSettings, setChgkSettings] = useState<GamePartSettings>(); // Настройки ЧГК
    const [matrixSettings, setMatrixSettings] = useState<GamePartSettings>(); // Настройки матрицы
    const [gameName, setGameName] = useState<string>();
    const { gameId } = useParams<{ gameId: string }>();
    const [timer, setTimer] = useState<number>(70000); // Таймер одного вопроса
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [itemName, setItemName] = useState<string>('');
    const [itemId, setItemId] = useState<string>('');
    const [operationName, setOperationName] = useState<null | OperationName>(null);
    const [breakTime, setBreakTime] = useState<number>(0); // в секундах
    const [isBreak, setIsBreak] = useState<boolean>(false); // флаг для перерыва
    const [isAppeal, setIsAppeal] = useState<boolean[]>([]);
    const [isConnectionError, setIsConnectionError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isStop, setIsStop] = useState<boolean>(false);

    const requester = {
        getPayload: (obj: any) =>
            JSON.stringify({
                cookie: getCookie('authorization'),
                gameId: gameId,
                ...obj,
            }),

        startRequests: () => {
            conn.send(requester.getPayload({ action: 'time' }));
            conn.send(requester.getPayload({ action: 'getAllAppeals' }));
            conn.send(requester.getPayload({ action: 'isOnBreak' }));
            conn.send(requester.getPayload({ action: 'getQuestionNumber' }));

            ping = setInterval(() => {
                conn.send(JSON.stringify({ action: 'ping' }));
            }, 30000);
        },

        changeQuestion: (questionNumber: number, roundNumber: number, gamePart: 'chgk' | 'matrix') => {
            conn.send(
                requester.getPayload({
                    action: 'changeQuestion',
                    questionNumber: questionNumber,
                    tourNumber: roundNumber,
                    activeGamePart: gamePart,
                }),
            );
        },

        getQuestionNumber: () => {
            conn.send(requester.getPayload({ action: 'getQuestionNumber' }));
        },

        startGame: (gamePart: 'chgk' | 'matrix') => {
            conn.send(
                requester.getPayload({
                    action: 'Start',
                    gamePart: gamePart,
                }),
            );
        },

        pauseGame: (gamePart: 'chgk' | 'matrix') => {
            conn.send(
                requester.getPayload({
                    action: 'Pause',
                    gamePart: gamePart,
                }),
            );
        },

        stopGame: (gamePart: 'chgk' | 'matrix') => {
            conn.send(
                requester.getPayload({
                    action: 'Stop',
                    gamePart: gamePart,
                }),
            );
        },

        addTenSeconds: (gamePart: 'chgk' | 'matrix') => {
            conn.send(
                requester.getPayload({
                    action: '+10sec',
                    gamePart: gamePart,
                }),
            );
        },

        stopBreak: () => {
            conn.send(requester.getPayload({ action: 'stopBreak' }));
        },

        checkTime: () => {
            conn.send(requester.getPayload({ action: 'checkTime' }));
        },

        checkBreakTime: (time: number) => {
            conn.send(
                requester.getPayload({
                    action: 'checkBreakTime',
                    time: time,
                }),
            );
        },
    };

    const handlers = {
        handleTimeMessage: (time: number, isStarted: boolean) => {
            setTimer(time);
            if (isStarted) {
                setPlayOrPause('pause');
                clearInterval(interval);
                interval = setInterval(() => requester.checkTime(), 1000);
            }
        },

        handleCheckTimeMessage: (time: number) => {
            if (time == 0) {
                clearInterval(interval);
            }

            setIsStop(stop => {
                if (!stop) {
                    if (time == 0) {
                        setPlayOrPause('play');
                    }

                    setTimer(time);
                }

                return stop;
            });
        },

        handleCheckBreakTimeMessage: (currentTime: number, time: number) => {
            setBreakTime(time);
        },

        handleAppealMessage: (questionNumber: number) => {
            setIsAppeal(appeals => {
                const appealsCopy = appeals.slice();
                appealsCopy[questionNumber - 1] = true;
                return appealsCopy;
            });
        },

        handleAppealsMessage: (appealByQuestionNumber: number[]) => {
            setIsAppeal(appeals => {
                const appealsCopy = new Array(appeals.length).fill(false);
                for (const number of appealByQuestionNumber) {
                    appealsCopy[number - 1] = true;
                }
                return appealsCopy;
            });
        },

        handleIsOnBreakMessage: (status: boolean, time: number) => {
            if (status) {
                setIsBreak(true);
                setBreakTime(time);
                clearInterval(breakInterval);
                breakInterval = setInterval(
                    () =>
                        setBreakTime(time => {
                            requester.checkBreakTime(time);
                            if (time - 1 <= 0) {
                                clearInterval(breakInterval);
                                setIsBreak(false);
                            }
                            return time - 1 > 0 ? time - 1 : 0;
                        }),
                    1000,
                );
            }
        },

        handleChangeQuestionNumber: (round: number, question: number, activeGamePart: 'chgk' | 'matrix') => {
            setClickedTourIndex(round);
            setActiveTour(round);
            setClickedGamePart(activeGamePart);
            setActiveGamePart(activeGamePart);
            setActiveQuestion(question);
            setIsLoading(false);
        },

        handleQuestionNumberIsUndefinedMessage: (activeGamePart: 'chgk' | 'matrix') => {
            setClickedTourIndex(1);
            setActiveTour(1);
            setClickedGamePart(activeGamePart);
            setActiveGamePart(activeGamePart);
            setIsLoading(false);
        },
    };

    useEffect(() => {
        ServerApi.getGame(gameId).then(res => {
            if (res.status === 200) {
                res.json().then(({ name, chgkSettings, matrixSettings }) => {
                    setGameName(name);
                    setMatrixSettings(matrixSettings ?? null);
                    setChgkSettings(chgkSettings ?? null);
                    setIsAppeal(
                        new Array(chgkSettings ? chgkSettings.roundsCount * chgkSettings.questionsCount : 0).fill(false),
                    );
                });
            }
        });

        conn = new WebSocket(getUrlForSocket());

        conn.onopen = () => requester.startRequests();
        conn.onclose = () => setIsConnectionError(true);
        conn.onerror = () => setIsConnectionError(true);

        conn.onmessage = function (event) {
            const jsonMessage = JSON.parse(event.data);

            switch (jsonMessage.action) {
                case 'time':
                    handlers.handleTimeMessage(jsonMessage.time, jsonMessage.isStarted);
                    break;
                case 'appeal':
                    handlers.handleAppealMessage(jsonMessage.questionNumber);
                    break;
                case 'appeals':
                    handlers.handleAppealsMessage(jsonMessage.appealByQuestionNumber);
                    break;
                case 'isOnBreak':
                    handlers.handleIsOnBreakMessage(jsonMessage.status, jsonMessage.time);
                    break;
                case 'changeQuestionNumber':
                    handlers.handleChangeQuestionNumber(jsonMessage.round, jsonMessage.question, jsonMessage.activeGamePart);
                    break;
                case 'questionNumberIsUndefined':
                    handlers.handleQuestionNumberIsUndefinedMessage(jsonMessage.activeGamePart);
                    break;
                case 'checkTime':
                    handlers.handleCheckTimeMessage(jsonMessage.time);
                    break;
                case 'checkBreakTime':
                    handlers.handleCheckBreakTimeMessage(jsonMessage.currentTime, jsonMessage.time);
                    break;
            }
        };

        return () => clearInterval(ping);
    }, []);

    const Tour: FC<TourProps> = props => {
        const handleTourClick = () => {
            if (activeTourIndex === props.tourNumber && activeGamePart === props.gamePart) {
                requester.getQuestionNumber();
            } else {
                setClickedTourIndex(props.tourIndex);
                setClickedGamePart(props.gamePart);
                setActiveQuestion(undefined);
            }
        };

        return (
            <>
                <Button
                    className={`${classesButton.button} ${classesButton.button_transparent}`}
                    content={props.tourName || `Тур ${props.tourNumber}`}
                    onClick={handleTourClick}
                    hasRightIcon={
                        activeTourIndex !== undefined &&
                        props.tourIndex === activeTourIndex &&
                        activeGamePart === props.gamePart
                    }
                    icon={
                        <PlayArrowIcon
                            sx={{
                                fontSize: 'var(--font-size-32)',
                                color: 'var(--color-text-icon-secondary)',
                            }}
                        />
                    }
                    active={props.tourIndex === clickedTourIndex && clickedGamePart === props.gamePart}
                />
            </>
        );
    };

    const parseTimer = (time: number) => {
        const minutes = Math.floor(time / 1000 / 60)
            .toString()
            .padStart(1, '0');
        const sec = Math.ceil((time / 1000) % 60)
            .toString()
            .padStart(2, '0');
        return `${minutes}:${sec}`;
    };

    const handleQuestionClick = (event: React.SyntheticEvent, gamePart: 'matrix' | 'chgk') => {
        const activeQuestion = document.querySelector(`.${classes.activeQuestion}`) as HTMLDivElement;
        const clickedQuestion = event.target as HTMLDivElement;
        if (activeQuestion) {
            activeQuestion.classList.remove(classes.activeQuestion);
        }
        clickedQuestion.classList.add(classes.activeQuestion);
        setActiveQuestion(+clickedQuestion.id);
        setActiveTour(clickedTourIndex || 0);
        setActiveGamePart(gamePart);
        setTimer(gamePart === 'chgk' ? 70000 : 20000);

        requester.changeQuestion(+clickedQuestion.id, clickedTourIndex || 0, gamePart);

        handleStopClick(gamePart); // Прошлый вопрос остановится!
    };

    const handlePlayClick = (gamePart: 'chgk' | 'matrix') => {
        if (playOrPause === 'play') {
            requester.startGame(gamePart);
            setIsStop(false);
            setPlayOrPause('pause');
            clearInterval(interval);
            interval = setInterval(() => requester.checkTime(), 1000);
        } else {
            clearInterval(interval);
            requester.pauseGame(gamePart);
            setPlayOrPause('play');
        }
    };

    const handleStopClick = (gamePart: 'matrix' | 'chgk' | undefined) => {
        setPlayOrPause('play');
        if (gamePart !== undefined) {
            requester.stopGame(gamePart);
        }
        setIsStop(true);
        clearInterval(interval);
        setTimer(gamePart === 'chgk' ? 70000 : 20000);
    };

    const handleAddedTimeClick = (gamePart: 'chgk' | 'matrix') => {
        requester.addTenSeconds(gamePart);
        setTimer(t => t + 10000);
    };

    const handleEndClick = () => {
        setItemNameAndId();
        setOperationName(OperationName.Ending);
        setIsModalOpen(true);
    };

    const setItemNameAndId = useCallback(() => {
        if (gameName) {
            setItemName(gameName);
        }
        if (gameId) {
            setItemId(gameId);
        }
    }, [gameName, gameId]);

    const renderTours = (toursCount: number, gamePart: 'matrix' | 'chgk', tourNames?: string[]) => {
        return Array.from(Array(toursCount).keys()).map(i => (
            <Tour
                gamePart={gamePart}
                key={`tour_${i}_${gamePart}`}
                tourIndex={i + 1}
                tourNumber={i + 1}
                tourName={tourNames?.[i]}
            />
        ));
    };

    const renderQuestions = (questionsCount: number, gamePart: 'matrix' | 'chgk') => {
        if (!activeTourIndex || !clickedTourIndex || !questionsCount) {
            return null;
        }

        return Array.from(Array(questionsCount).keys()).map(i => {
            return (
                <div
                    className={classes.questionWrapper}
                    key={`tour_${activeTourIndex}_question_${i + 1}`}
                    onClick={event => handleQuestionClick(event, gamePart)}
                >
                    <div
                        className={`${classes.question} ${
                            activeQuestionNumber !== undefined && i === activeQuestionNumber - 1 ? classes.activeQuestion : ''
                        }`}
                        id={`${i + 1}`}
                    >
                        Вопрос {questionsCount * (clickedTourIndex - 1) + (i + 1)}
                    </div>
                    <Button
                        className={`${classesButton.button} ${classesButton.button_link}`}
                        content={'Ответы'}
                        type={TypeButton.Link}
                        to={`/admin/game/${gameId}/${gamePart}/answers/${clickedTourIndex}/${i + 1}`}
                        hasRightIcon={clickedGamePart === 'chgk' && isAppeal[(clickedTourIndex - 1) * questionsCount + i]}
                        icon={
                            <div className={classes.opposition}>
                                <CircleRounded
                                    sx={{
                                        fill: 'var(--color-fill-notify)',
                                        fontSize: 'var(--font-size-20)',
                                        color: 'darkred',
                                        userSelect: 'none',
                                        pointerEvents: 'none',
                                    }}
                                />
                            </div>
                        }
                    />
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
        requester.stopBreak();
    };

    if (isLoading || !gameName) {
        return <Loader />;
    }

    return (
        <PageWrapper>
            <Header isAuthorized={true} isAdmin={true}>
                <div className={classes.gameName}>{gameName}</div>
            </Header>

            {isModalOpen ? (
                <Modal
                    modalType={'break'}
                    gameId={gameId}
                    closeModal={setIsModalOpen}
                    startBreak={setIsBreak}
                    setBreakTime={setBreakTime}
                    operationName={operationName}
                    itemName={itemName}
                    itemId={itemId}
                />
            ) : null}

            <div className={classes.contentWrapper}>
                <div className={classes.buttonsWrapper}>
                    <div className={classes.buttons}>
                        <Button
                            className={`${classesButton.button}`}
                            hasLeftIcon
                            icon={
                                playOrPause === 'play' ? (
                                    <PlayArrowIcon
                                        sx={{
                                            fontSize: 'var(--font-size-20)',
                                        }}
                                    />
                                ) : (
                                    <PauseIcon
                                        sx={{
                                            fontSize: 'var(--font-size-20)',
                                        }}
                                    />
                                )
                            }
                            onClick={() => handlePlayClick(activeGamePart as 'chgk' | 'matrix')}
                            disabled={isBreak || activeQuestionNumber === undefined}
                        />

                        <Button
                            className={`${classesButton.button}`}
                            hasLeftIcon
                            icon={
                                <StopIcon
                                    sx={{
                                        fontSize: 'var(--font-size-20)',
                                    }}
                                />
                            }
                            onClick={() => handleStopClick(activeGamePart)}
                            disabled={isBreak || activeQuestionNumber === undefined}
                        />
                        <Button
                            className={`${classesButton.button}`}
                            content={'10 секунд'}
                            hasLeftIcon
                            icon={
                                <AddRounded
                                    sx={{
                                        fontSize: 'var(--font-size-20)',
                                    }}
                                />
                            }
                            onClick={() => handleAddedTimeClick(activeGamePart as 'chgk' | 'matrix')}
                            disabled={isBreak || activeQuestionNumber === undefined}
                        />
                        <Button
                            className={`${classesButton.button}`}
                            content={isBreak ? `Закончить перерыв` : `Начать перерыв`}
                            onClick={isBreak ? stopBreak : openBreakModal}
                        />
                    </div>
                    <Button
                        className={`${classesButton.button} ${classesButton.button_link}`}
                        to={`/admin/rating/${gameId}`}
                        content={'Рейтинг'}
                        hasLeftIcon
                        type={TypeButton.Link}
                        icon={<BarChartRounded sx={{ fontSize: 'var(--font-size-20)' }} />}
                    />
                </div>

                <div className={classes.tablesWrapper}>
                    <div className={classes.toursWrapper}>
                        <Scrollbars
                            autoHide
                            autoHideTimeout={500}
                            autoHideDuration={200}
                            renderThumbVertical={() => (
                                <div
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }}
                                />
                            )}
                            renderTrackHorizontal={props => <div {...props} style={{ display: 'none' }} />}
                            classes={{
                                view: classes.scrollbarView,
                                trackVertical: classes.verticalTrack,
                                root: classes.scrollbarContainer,
                            }}
                        >
                            {matrixSettings ? (
                                <div className={classes.gamePartWrapper}>
                                    <div className={classes.gamePartName}>Матрица</div>
                                    {renderTours(matrixSettings.roundsCount, 'matrix', matrixSettings.roundNames)}
                                    <Divider
                                        sx={{
                                            margin: '16px 0',
                                            borderColor: 'var(--color-strokes-default)',
                                        }}
                                    />
                                </div>
                            ) : null}
                            {chgkSettings ? (
                                <div className={classes.gamePartWrapper}>
                                    <div className={classes.gamePartName}>ЧГК</div>
                                    {renderTours(chgkSettings.roundsCount, 'chgk')}
                                </div>
                            ) : null}
                        </Scrollbars>
                    </div>

                    <div className={classes.questionsWrapper}>
                        <Scrollbars
                            autoHide
                            autoHideTimeout={500}
                            autoHideDuration={200}
                            renderThumbVertical={() => (
                                <div
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }}
                                />
                            )}
                            renderTrackHorizontal={props => <div {...props} style={{ display: 'none' }} />}
                            classes={{
                                view: classes.scrollbarView,
                                trackVertical: classes.verticalTrack,
                                root: classes.scrollbarContainer,
                            }}
                        >
                            {clickedGamePart === 'matrix'
                                ? renderQuestions(matrixSettings?.questionsCount || 0, 'matrix')
                                : null}
                            {clickedGamePart === 'chgk' ? renderQuestions(chgkSettings?.questionsCount || 0, 'chgk') : null}
                        </Scrollbars>
                    </div>
                    <div className={classes.infoWrapper}>
                        <TimeWidget time={isBreak ? parseTimer(breakTime * 1000) : parseTimer(timer)} isBreak={isBreak} />
                        <div className={classes.buttonWrapper}>
                            <Button
                                className={`${classesButton.button} ${classesButton.button_red} ${classesButton.button_link}`}
                                content={'Завершить игру'}
                                onClick={handleEndClick}
                                hasLeftIcon
                                icon={
                                    <ExitToApp
                                        style={{
                                            color: 'var(--color-strokes-error)',
                                            fontSize: 'var(--font-size-24)',
                                        }}
                                    />
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Snackbar
                sx={{ marginTop: '8vh' }}
                open={isConnectionError}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                autoHideDuration={5000}
            >
                <Alert severity="error" sx={{ width: '100%' }}>
                    Ошибка соединения. Обновите страницу
                </Alert>
            </Snackbar>
        </PageWrapper>
    );
};

export default AdminGame;
