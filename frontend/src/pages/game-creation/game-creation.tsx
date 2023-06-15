import React, {FC, useEffect, useState} from 'react';
import classes from './game-creation.module.scss';
import Header from '../../components/header/header';
import CheckboxBlock from '../../components/checkbox-block/checkbox-block';
import {Scrollbars} from 'rc-scrollbars';
import {GameCreatorMode, GameCreatorProps} from '../../entities/game-creator/game-creator.interfaces';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import {
    addTeamInGame,
    createGame,
    deleteTeamFromGame,
    editGame,
    GamePartSettings,
    getAll,
    getGame
} from '../../server-api/server-api';
import {Redirect, useLocation} from 'react-router-dom';
import NavBar from '../../components/nav-bar/nav-bar';
import {Team} from '../admin-start-screen/admin-start-screen';
import {IconButton, InputAdornment, OutlinedInput, Skeleton, TextareaAutosize} from '@mui/material';
import PageBackdrop from '../../components/backdrop/backdrop';
import Loader from '../../components/loader/loader';
import Modal from '../../components/modal/modal';
import Scrollbar from '../../components/scrollbar/scrollbar';
import {AccessLevel} from "../../components/game-item/game-item";
import CustomCheckbox from "../../components/custom-checkbox/custom-checkbox";
import {Input} from "../../components/input/input";
import {AddRounded, ClearRounded, EditRounded, SearchRounded} from "@mui/icons-material";

enum GameCreationPages {
    Main = 'main',
    ChgkSettings = 'chgk-settings',
    ChgkQuestions = 'chgk-questions',
    MatrixSettings = 'matrix-settings',
    MatrixTours = 'matrix-tours',
    MatrixQuestions = 'matrix-questions',
    QuizSettings = 'quiz-settings',
    QuizTours = 'quizTours',
    QuizQuestions = 'quiz-questions'
}

enum GameTypeMode {
    chgk = 'chgk',
    matrix = 'matrix',
    quiz = 'quiz'
}

export enum RoundType {
    NORMAL = 'normal',
    BLITZ = 'blitz'
}

const GameCreator: FC<GameCreatorProps> = props => {
    const [teamsFromDB, setTeamsFromDB] = useState<Team[]>();
    const [isCreatedSuccessfully, setIsCreatedSuccessfully] = useState<boolean>(false);
    const location = useLocation<{ id: string, name: string }>();
    const [gameName, setGameName] = useState<string>(props.mode === GameCreatorMode.edit ? location.state.name : '');
    const [chosenTeams, setChosenTeams] = useState<string[]>();
    const [gameAccessLevel, setGameAccessLevel] = useState<AccessLevel>(AccessLevel.PRIVATE);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGameNameInvalid, setIsGameNameInvalid] = useState<boolean>(false);
    const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isCancelled, setIsCancelled] = useState<boolean>(false);
    const [page, setPage] = useState<GameCreationPages>(GameCreationPages.Main);

    const [chgkSettings, setChgkSettings] = useState<GamePartSettings | undefined>();
    const [tempChgkRoundsCount, setTempChgkRoundsCount] = useState<number | undefined>();
    const [tempChgkQuestionsCount, setTempChgkQuestionsCount] = useState<number | undefined>();
    const [tempChgkQuestions, setTempChgkQuestions] = useState<Record<number, string[]> | undefined>();

    const [tempMatrixRoundsCount, setTempMatrixRoundsCount] = useState<number | undefined>();
    const [tempMatrixQuestionsCount, setTempMatrixQuestionsCount] = useState<number | undefined>();
    const [tempMatrixQuestions, setTempMatrixQuestions] = useState<Record<number, string[]> | undefined>();
    const [tempMatrixRoundNames, setTempMatrixRoundNames] = useState<string[] | undefined>();
    const [matrixSettings, setMatrixSettings] = useState<GamePartSettings | undefined>();

    const [tempQuizRoundsCount, setTempQuizRoundsCount] = useState<number | undefined>();
    const [tempQuizQuestionsCount, setTempQuizQuestionsCount] = useState<number | undefined>();
    const [tempQuizQuestions, setTempQuizQuestions] = useState<Record<number, string[]> | undefined>();
    const [tempQuizRoundNames, setTempQuizRoundNames] = useState<string[] | undefined>();
    const [tempQuizRoundTypes, setTempQuizRoundTypes] = useState<RoundType[] | undefined>([RoundType.NORMAL]);
    const [quizSettings, setQuizSettings] = useState<GamePartSettings | undefined>();

    const [isDeleteChgkModalVisible, setIsDeleteChgkModalVisible] = useState<boolean>(false);
    const [isDeleteMatrixModalVisible, setIsDeleteMatrixModalVisible] = useState<boolean>(false);
    const [isDeleteQuizModalVisible, setIsDeleteQuizModalVisible] = useState<boolean>(false);

    const [submitted, setSubmitted] = useState<boolean>(false);
    const [isSaveChgkQuestions, setIsSaveChgkQuestions] = useState<boolean>(false);
    const [isSaveMatrixTours, setIsSaveMatrixTours] = useState<boolean>(false);
    const [isSaveMatrixQuestions, setIsSaveMatrixQuestions] = useState<boolean>(false);
    const [isSaveQuizTours, setIsSaveQuizTours] = useState<boolean>(false);
    const [isSaveQuizQuestions, setIsSaveQuizQuestions] = useState<boolean>(false);

    const oldGameId = props.mode === GameCreatorMode.edit ? location.state.id : '';

    if (teamsFromDB && (props.mode != GameCreatorMode.edit || chosenTeams) && isPageLoading) {
        teamsFromDB
            .sort((a: Team, b: Team) => chosenTeams?.includes(a.name) && chosenTeams?.includes(b.name) && a.name.toLowerCase() < b.name.toLowerCase()
            || chosenTeams?.includes(a.name) && !chosenTeams?.includes(b.name)
            || !chosenTeams?.includes(a.name) && !chosenTeams?.includes(b.name) && a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
        setIsPageLoading(false);
    }

    useEffect(() => {
        getAll('/teams/').then(res => {
            if (res.status === 200) {
                res.json().then(({teams}) => {
                    setTeamsFromDB(teams);
                });
            } else {
                // TODO: обработать ошибку
            }
        });

        if (props.mode === GameCreatorMode.edit) {
            getGame(oldGameId).then(res => {
                if (res.status === 200) {
                    res.json().then(({teams, chgkSettings, matrixSettings, quizSettings, accessLevel}) => {
                        setChgkSettings(chgkSettings);
                        setMatrixSettings(matrixSettings);
                        setQuizSettings(quizSettings);
                        setChosenTeams(teams);
                        setGameAccessLevel(accessLevel);
                    });
                }
            });
        }
    }, []);

    const handleCheckboxChange = async (event: React.SyntheticEvent) => {
        const addTeamInChosenTeams = (team: string) => setChosenTeams(teams => {
            if (teams) {
                teams.push(team);
            } else {
                teams = [team];
            }
            return teams;
        });

        const deleteTeamFromChosenTeams = (team: string) => setChosenTeams(teams => {
            if (teams) {
                teams.splice(teams.indexOf(team), 1);
            }
            return teams;
        });

        const element = event.target as HTMLInputElement;
        if (element.checked) {
            const team = teamsFromDB?.find(t => t.name == element.name);
            if (!team) return;

            props.mode === GameCreatorMode.creation
                ? addTeamInChosenTeams(element.name)
                : await addTeamInGame(oldGameId, team.id)
                    .then(res => {
                        if (res.status === 200) {
                            addTeamInChosenTeams(element.name);
                        } else {
                            // TODO
                        }
                    });
        } else if (chosenTeams?.includes(element.name)) {
            const team = teamsFromDB?.find(t => t.name == element.name);
            if (!team) return;

            props.mode === GameCreatorMode.creation
                ? deleteTeamFromChosenTeams(element.name)
                : await deleteTeamFromGame(oldGameId, team.id)
                    .then(res => {
                        if (res.status === 200) {
                            deleteTeamFromChosenTeams(element.name);
                        } else {
                            // TODO
                        }
                    });
        }
    };

    const handleCheckboxAccessLevelChange = (event: React.SyntheticEvent) => {
        const element = event.target as HTMLInputElement;
        if (element.checked) {
            setGameAccessLevel(AccessLevel.PUBLIC);
        } else {
            setGameAccessLevel(AccessLevel.PRIVATE);
        }
    };

    const handleRoundTypeCheckboxChange = (event: React.SyntheticEvent, index: number) => {
        const element = event.target as HTMLInputElement;
        if (element.checked) {
            setTempQuizRoundTypes(roundTypes => {
                if (roundTypes) {
                    roundTypes[index] = RoundType.BLITZ;
                }
                return roundTypes;
            });
        } else {
            setTempQuizRoundTypes(roundTypes => {
                if (roundTypes) {
                    roundTypes[index] = RoundType.NORMAL;
                }
                return roundTypes;
            });
        }
    };

    const renderAccessLevelGameCheckbox = () => {
        return(
            <CustomCheckbox
                label={'Публичная регистрация команд'}
                onChange={handleCheckboxAccessLevelChange}
                checked={gameAccessLevel === AccessLevel.PUBLIC}
            />
        );
    }

    const renderTeams = () => {
        if (props.mode === GameCreatorMode.edit && !chosenTeams || !teamsFromDB) {
            return Array.from(Array(5).keys()).map(i =>
                <Skeleton key={`team_skeleton_${i}`}
                          variant='rectangular'
                          width='90%'
                          height='5vh'
                          sx={{margin: '0 0.4vw 1.3vh 1.4vw'}}
                />
            );
        }

        return teamsFromDB
            .filter(team => searchQuery.length < 1 || team.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((team, index) => {
                return chosenTeams?.includes(team.name)
                    ? <CheckboxBlock
                        name={team.name}
                        key={`${team.id}_${index}_chosen`}
                        checked={true}
                        onChange={handleCheckboxChange}
                    />
                    : <CheckboxBlock
                        name={team.name}
                        key={`${team.id}_${index}`}
                        onChange={handleCheckboxChange}
                    />;
            });
    };


    const handleChgkQuestionChange = (event: React.ChangeEvent<HTMLTextAreaElement>, roundIndex: number, questionIndex: number) => {
        setTempChgkQuestions(prevState => {
            const newState = {...prevState};
            newState[roundIndex + 1][questionIndex] = event.target.value;
            return newState;
        });
    };

    const handleMatrixQuestionChange = (event: React.ChangeEvent<HTMLTextAreaElement>, roundIndex: number, questionIndex: number) => {
        setTempMatrixQuestions(prevState => {
            const newState = {...prevState};
            newState[roundIndex + 1][questionIndex] = event.target.value;
            return newState;
        });
    };

    const handleQuizQuestionChange = (event: React.ChangeEvent<HTMLTextAreaElement>, roundIndex: number, questionIndex: number) => {
        setTempQuizQuestions(prevState => {
            const newState = {...prevState};
            newState[roundIndex + 1][questionIndex] = event.target.value;
            return newState;
        });
    };

    const renderChgkQuestionInputs = () => {
        return Array.from(Array(tempChgkRoundsCount).keys()).map((roundIndex) => {
            return (
                <div className={classes.tourQuestionInputsWrapper} key={`chgk_tour_${roundIndex + 1}`}>
                    <p className={classes.tourName}>{`Тур ${roundIndex + 1}`}</p>

                    {
                        Array.from(Array(tempChgkQuestionsCount).keys()).map((questionIndex) => (
                            <div className={classes.questionInputWrapper}
                                 key={`question_input_wrapper_${questionIndex + 1}`}>
                                <div className={classes.questionNumber}>{questionIndex + 1}</div>

                                <TextareaAutosize
                                    className={classes.questionInput}
                                    minRows={1}
                                    value={tempChgkQuestions?.[roundIndex + 1]?.[questionIndex] || chgkSettings?.questions?.[roundIndex + 1]?.[questionIndex]}
                                    onChange={(event) => handleChgkQuestionChange(event, roundIndex, questionIndex)}
                                />
                            </div>
                        ))
                    }
                </div>
            );
        });
    };

    const renderMatrixQuestionInputs = () => {
        return Array.from(Array(tempMatrixRoundsCount).keys()).map((roundIndex) => {
            return (
                <div className={classes.tourQuestionInputsWrapper} key={`matrix_tour_${roundIndex + 1}`}>
                    <p className={classes.tourName}>{`Тур ${roundIndex + 1} — ${tempMatrixRoundNames?.[roundIndex]}`}</p>

                    {
                        Array.from(Array(tempMatrixQuestionsCount).keys()).map((questionIndex) => (
                            <div className={classes.questionInputWrapper}
                                 key={`question_input_wrapper_${questionIndex + 1}`}>
                                <div className={classes.questionNumber}>{questionIndex + 1}</div>

                                <TextareaAutosize
                                    className={classes.questionInput}
                                    minRows={1}
                                    value={tempMatrixQuestions?.[roundIndex + 1][questionIndex] || matrixSettings?.questions?.[roundIndex + 1]?.[questionIndex]}
                                    onChange={(event) => handleMatrixQuestionChange(event, roundIndex, questionIndex)}
                                />
                            </div>
                        ))
                    }
                </div>
            );
        });
    };

    const renderQuizQuestionInputs = () => {
        return Array.from(Array(tempQuizRoundsCount).keys()).map((roundIndex) => {
            return (
                <div className={classes.tourQuestionInputsWrapper} key={`quiz_tour_${roundIndex + 1}`}>
                    <p className={classes.tourName}>{`Тур ${roundIndex + 1} — ${tempQuizRoundNames?.[roundIndex]}`}</p>

                    {
                        Array.from(Array(tempQuizQuestionsCount).keys()).map((questionIndex) => (
                            <div className={classes.questionInputWrapper}
                                 key={`question_input_wrapper_${questionIndex + 1}`}>
                                <div className={classes.questionNumber}>{questionIndex + 1}</div>

                                <TextareaAutosize
                                    className={classes.questionInput}
                                    minRows={1}
                                    value={tempQuizQuestions?.[roundIndex + 1][questionIndex] || quizSettings?.questions?.[roundIndex + 1]?.[questionIndex]}
                                    onChange={(event) => handleQuizQuestionChange(event, roundIndex, questionIndex)}
                                />
                            </div>
                        ))
                    }
                </div>
            );
        });
    };

    const handleSubmit = async (event: React.SyntheticEvent) => {
        event.preventDefault();
        if (!chgkSettings && !matrixSettings && !quizSettings) {
            setSubmitted(true);
            return;
        }
        setIsLoading(true);
        if (props.mode === GameCreatorMode.creation) {
            const teams = new Set(chosenTeams ?? []);
            const teamIds = teamsFromDB
                ?.filter(t => teams.has(t.name))
                .map(t => t.id);

            await createGame(gameName, teamIds ?? [], chgkSettings, matrixSettings, quizSettings, gameAccessLevel)
                .then(res => {
                    if (res.status === 200) {
                        setIsCreatedSuccessfully(true);
                    } else {
                        setIsGameNameInvalid(true);
                        setIsLoading(false);
                    }
                });
        } else {
            await editGame(oldGameId, gameName, chgkSettings, matrixSettings, quizSettings, gameAccessLevel)
                .then(res => {
                    if (res.status === 200) {
                        setIsCreatedSuccessfully(true);
                    } else {
                        setIsGameNameInvalid(true);
                        setIsLoading(false);
                    }
                });
        }
    };

    const handleGameNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGameName(event.target.value);
    };

    const handleToursCountChange = (event: React.ChangeEvent<HTMLInputElement>, mode: GameTypeMode) => {
        if (+event.target.value <= 30) {
            if (mode === GameTypeMode.chgk) {
                setTempChgkRoundsCount(+event.target.value);
                const questions: Record<number, string[]> = {};
                for (let i = 0; i < (+event.target.value || 0); i++) {
                    if (chgkSettings?.questions && chgkSettings?.questions[i + 1]) {
                        questions[i + 1] = chgkSettings?.questions[i + 1] as string[];
                    } else {
                        questions[i + 1] = new Array(tempChgkQuestionsCount as number).fill('');
                    }
                }
                setTempChgkQuestions(questions);
            } else if (mode === GameTypeMode.matrix) {
                setTempMatrixRoundsCount(+event.target.value);
                const questions: Record<number, string[]> = {};
                for (let i = 0; i < (+event.target.value || 0); i++) {
                    if (matrixSettings?.questions && matrixSettings?.questions[i + 1]) {
                        questions[i + 1] = matrixSettings?.questions[i + 1] as string[];
                    } else {
                        questions[i + 1] = new Array(tempMatrixQuestionsCount as number).fill('');
                    }
                }
                setTempMatrixQuestions(questions);
            } else if (mode === GameTypeMode.quiz) {
                setTempQuizRoundsCount(+event.target.value);
                const questions: Record<number, string[]> = {};
                for (let i = 0; i < (+event.target.value || 0); i++) {
                    if (quizSettings?.questions && quizSettings?.questions[i + 1]) {
                        questions[i + 1] = quizSettings?.questions[i + 1] as string[];
                    } else {
                        questions[i + 1] = new Array(tempQuizQuestionsCount as number).fill('');
                    }
                }
            } else {

            }
        }
    };

    const handleQuestionsCountChange = (event: React.ChangeEvent<HTMLInputElement>, mode: GameTypeMode) => {
        if (+event.target.value <= 30) {
            if (mode === GameTypeMode.chgk) {
                setTempChgkQuestionsCount(+event.target.value);
                const questions: Record<number, string[]> = {};
                for (let i = 0; i < (tempChgkRoundsCount || 0); i++) {
                    questions[i + 1] = new Array(+event.target.value).fill('');
                }
                setTempChgkQuestions(questions);

            } else if (mode === GameTypeMode.matrix) {
                setTempMatrixQuestionsCount(+event.target.value);
                const questions: Record<number, string[]> = {};
                for (let i = 0; i < (tempMatrixRoundsCount || 0); i++) {
                    questions[i + 1] = new Array(+event.target.value).fill('');
                }
                setTempMatrixQuestions(questions);

            } else if (mode === GameTypeMode.quiz) {
                setTempQuizQuestionsCount(+event.target.value);
                const questions: Record<number, string[]> = {};
                for (let i = 0; i < (tempMatrixRoundsCount || 0); i++) {
                    questions[i + 1] = new Array(+event.target.value).fill('');
                }
                setTempQuizQuestions(questions);
            } else {

            }
        }
    };

    const setTourName = (event: React.ChangeEvent<HTMLInputElement>, index: number, mode: GameTypeMode) => {
        if (mode === GameTypeMode.matrix) {
            setTempMatrixRoundNames(prevValue => prevValue?.map((tourName, i) => {
                if (i === index) {
                    return event.target.value;
                } else {
                    return tourName;
                }
            }));
        } else if (mode === GameTypeMode.quiz) {
            setTempQuizRoundNames(prevValue => prevValue?.map((tourName, i) => {
                if (i === index) {
                    return event.target.value;
                } else {
                    return tourName;
                }
            }));
        } else {

        }
    };

    const renderRoundNameInputs = (mode: GameTypeMode) => {
        if (mode === GameTypeMode.matrix) {
            return Array.from(Array(tempMatrixRoundsCount || matrixSettings?.roundsCount || 0).keys()).map((index) => {
                return (
                    <div className={classes.tourNameWrapper} key={`matrixTourName_${index}`}>
                        <div className={classes.tourNumber}>{index + 1}</div>
                        <Input
                            type='text'
                            id='tour-name'
                            name='tour-name'
                            placeholder='Название тура'
                            value={tempMatrixRoundNames?.[index]}
                            onChange={(event) => setTourName(event, index, mode)}
                            isInvalid={submitted && !tempMatrixRoundNames?.[index]}
                        />
                    </div>
                );
            });
        } else if (mode === GameTypeMode.quiz) {
            return Array.from(Array(tempQuizRoundsCount || quizSettings?.roundsCount || 0).keys()).map((index) => {
                return (
                    <div className={classes.tourNameWrapper} key={`matrixTourName_${index}`}>
                        <div className={classes.tourNumber}>{index + 1}</div>
                        <Input
                            type='text'
                            id='tour-name'
                            name='tour-name'
                            placeholder='Название тура'
                            value={tempQuizRoundNames?.[index]}
                            onChange={(event) => setTourName(event, index, mode)}
                            isInvalid={submitted && !tempQuizRoundNames?.[index]}
                        />
                        <CustomCheckbox
                            label={'Блиц'}
                            checked={tempQuizRoundTypes?.[index] === RoundType.BLITZ}
                            onChange={(event) => handleRoundTypeCheckboxChange(event, index)}
                        />
                    </div>
                );
            });
        } else {
            return(<></>);
        }


    };

    const renderGameWrapper = (
        gamePartName: string,
        gamePartSettings: GamePartSettings | undefined,
        gamePartPage: GameCreationPages,
        handleGamePartEditOnClick: React.MouseEventHandler,
        handleGamePartDeleteOnClick: React.MouseEventHandler
    ) => {
        return (
            <div className={classes.gameTypeWrapper}>
                <div className={classes.modeName}>{gamePartName}</div>
                {
                    !gamePartSettings
                        ?
                        <div className={classes.addModeButton} onClick={() => {
                            setSubmitted(false);
                            setPage(gamePartPage);
                        }}>
                            <AddRounded sx={{
                                color: 'var(--color-text-icon-primary)',
                                fontSize: 32
                            }}/>
                        </div>
                        :
                        <div className={classes.iconsWrapper}>
                            <IconButton
                                onClick={handleGamePartEditOnClick}
                                edge="end"
                                sx={{
                                    '& .MuiSvgIcon-root': {
                                        color: 'var(--color-control-accent-enabled)',
                                        fontSize: '32'
                                    }
                                }}
                            >
                                <EditRounded/>
                            </IconButton>
                            <IconButton
                                onClick={handleGamePartDeleteOnClick}
                                edge="end"
                                sx={{
                                    '& .MuiSvgIcon-root': {
                                        color: 'var(--color-control-error-enabled)',
                                        fontSize: 32
                                    }
                                }}
                            >
                                <ClearRounded/>
                            </IconButton>
                        </div>
                }
            </div>
        );
    }

    const renderPage = () => {
        switch (page) {
            case GameCreationPages.Main:
                return (
                    <div className={classes.pageWrapper}>
                        {
                            props.mode === GameCreatorMode.creation
                                ? <p className={classes.pageTitle}>Создание игры</p>
                                : <p className={classes.pageTitle}>Редактирование</p>
                        }
                        <form className={classes.gameCreationForm} onSubmit={handleSubmit}>
                            <div className={classes.contentWrapper}>
                                <div className={classes.gameParametersWrapper}>
                                    {
                                        (props.mode !== GameCreatorMode.edit || (props.mode === GameCreatorMode.edit && chosenTeams)) && teamsFromDB
                                            ? (
                                                <>
                                                    <Input
                                                        type='text'
                                                        id='gameName'
                                                        name='gameName'
                                                        placeholder='Название игры'
                                                        value={gameName}
                                                        style={{marginBottom: '3rem'}}
                                                        isInvalid={isGameNameInvalid}
                                                        errorHelperText='Придумайте другое название, такое уже занято'
                                                        onChange={handleGameNameChange}
                                                        onFocus={() => setIsGameNameInvalid(false)}
                                                    />

                                                    {
                                                        renderGameWrapper (
                                                            'ЧГК',
                                                            chgkSettings,
                                                            GameCreationPages.ChgkSettings,
                                                            () => {
                                                                setTempChgkQuestionsCount(chgkSettings?.questionsCount);
                                                                setTempChgkRoundsCount(chgkSettings?.roundsCount);
                                                                setTempChgkQuestions(chgkSettings?.questions);
                                                                setPage(GameCreationPages.ChgkSettings);
                                                            },
                                                            () => setIsDeleteChgkModalVisible(true)
                                                        )
                                                    }
                                                    {
                                                        renderGameWrapper(
                                                            'Матрица',
                                                            matrixSettings,
                                                            GameCreationPages.MatrixSettings,
                                                            () => {
                                                                setTempMatrixRoundsCount(matrixSettings?.roundsCount);
                                                                setTempMatrixQuestionsCount(matrixSettings?.questionsCount);
                                                                setTempMatrixRoundNames(matrixSettings?.roundNames);
                                                                setTempMatrixQuestions(matrixSettings?.questions);
                                                                setPage(GameCreationPages.MatrixSettings);
                                                            },
                                                            () => setIsDeleteMatrixModalVisible(true)
                                                        )
                                                    }
                                                    {
                                                        renderGameWrapper(
                                                            'Квиз',
                                                            quizSettings,
                                                            GameCreationPages.QuizSettings,
                                                            () => {
                                                                setTempQuizRoundsCount(quizSettings?.roundsCount);
                                                                setTempQuizQuestionsCount(quizSettings?.questionsCount);
                                                                setTempQuizRoundNames(quizSettings?.roundNames);
                                                                setTempQuizQuestions(quizSettings?.questions);
                                                                setTempQuizRoundTypes(quizSettings?.roundTypes);
                                                                setPage(GameCreationPages.QuizSettings);
                                                            },
                                                            () => setIsDeleteQuizModalVisible(true)
                                                        )
                                                    }
                                                    {
                                                        submitted && !matrixSettings && !chgkSettings && !quizSettings
                                                            ? <small style={{
                                                                color: 'var(--color-text-icon-error)',
                                                                fontSize: 'var(--font-size-16)',
                                                                marginTop: '-1.5vh'
                                                            }}>Добавьте хотя бы один режим в игру</small>
                                                            : null
                                                    }
                                                    {
                                                        renderAccessLevelGameCheckbox()
                                                    }
                                                </>
                                            )
                                            : (
                                                <>
                                                    <Skeleton variant='rectangular' width='100%' height='7vh'
                                                              style={{marginBottom: '3%'}}/>
                                                    <Skeleton variant='rectangular' width='100%' height='7vh'
                                                              style={{marginBottom: '3%'}}/>
                                                    <Skeleton variant='rectangular' width='100%' height='7vh'
                                                              style={{marginBottom: '3%'}}/>
                                                    <Skeleton variant='rectangular' width='100%' height='7vh'
                                                              style={{marginBottom: '3%'}}/>
                                                </>
                                            )
                                    }
                                </div>

                                <div className={classes.teamsWrapper}>
                                    <div className={classes.teamsLabel}>
                                        Команды
                                    </div>
                                    <div className={classes.searchWrapper}>
                                        <OutlinedInput className={classes.searchInput} value={searchQuery}
                                                       placeholder='Найдите команду'
                                                       onChange={(searchQuery: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(searchQuery.target.value)}
                                                       startAdornment={
                                                           <InputAdornment position='start'>
                                                               <SearchRounded sx={{
                                                                   fontSize: 24,
                                                                   color: 'var(--color-text-icon-secondary)'
                                                               }}/>
                                                           </InputAdornment>
                                                       } sx={{
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                border: '2px solid var(--foreground-color) !important',
                                                borderRadius: '.5rem',
                                                minHeight: '26px',
                                            }
                                        }}/>
                                    </div>
                                    <div className={classes.teamsDiv}>
                                        <Scrollbars autoHide autoHideTimeout={500}
                                                    autoHideDuration={200}
                                                    renderThumbVertical={() => <div style={{
                                                        backgroundColor: 'white',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}/>}
                                                    renderTrackHorizontal={props => <div {...props}
                                                                                         style={{display: 'none'}}/>}
                                                    classes={{view: classes.scrollbarView}}>
                                            {renderTeams()}
                                        </Scrollbars>
                                    </div>
                                </div>
                            </div>

                            <div className={classes.buttonsWrapper}>
                                <button type='submit' className={`${classes.button} ${classes.primaryButton}`}>
                                    {props.mode === GameCreatorMode.edit ? 'Сохранить' : 'Создать'}
                                </button>

                                <button type='button' className={`${classes.button} ${classes.defaultButton}`}
                                        onClick={() => setIsCancelled(true)}>
                                    Отменить
                                </button>
                            </div>
                        </form>
                    </div>
                );
            case GameCreationPages.ChgkSettings:
                return (
                    <div className={classes.pageWrapper}>
                        <p className={classes.gameSettingsPageTitle}>ЧГК</p>

                        <div className={classes.gameParamsWrapper}>
                            <div className={classes.toursCountWrapper}>
                                <label htmlFor="toursCount" className={classes.toursCountLabel}>Количество
                                    туров</label>
                                <input className={classes.toursCountInput}
                                       type="text"
                                       id="toursCount"
                                       name="toursCount"
                                       value={tempChgkRoundsCount || ''}
                                       placeholder='30'
                                       required={true}
                                       onChange={(event) => handleToursCountChange(event, GameTypeMode.chgk)}/>
                            </div>

                            <div className={classes.questionsCountWrapper}>
                                <label htmlFor="questionsCount" className={classes.questionsCountLabel}>Вопросов в
                                    туре</label>
                                <input className={classes.questionsCountInput}
                                       type="text"
                                       id="questionsCount"
                                       name="questionsCount"
                                       value={tempChgkQuestionsCount || ''}
                                       placeholder='30'
                                       required={true}
                                       onChange={(event) => handleQuestionsCountChange(event, GameTypeMode.chgk)}/>
                            </div>
                        </div>
                        <div className={classes.addButtonWrapper}>
                            <button className={`${classes.button} ${classes.defaultButton}`}
                                    disabled={!tempChgkQuestionsCount || !tempChgkRoundsCount}
                                    onClick={() => {
                                        if (!tempChgkQuestions || !Object.values(tempChgkQuestions).length) {
                                            const questions: Record<number, string[]> = {};
                                            for (let i = 0; i < (tempChgkRoundsCount || 0); i++) {
                                                questions[i + 1] = new Array(tempChgkQuestionsCount as number).fill('');
                                            }
                                            setTempChgkQuestions(questions);
                                        }
                                        setPage(GameCreationPages.ChgkQuestions);
                                    }}>
                                Добавить вопросы в игру
                            </button>
                        </div>

                        <div className={classes.gameParamsButtonsWrapper}>
                            <button type='submit' className={`${classes.button} ${classes.primaryButton}`}
                                    disabled={(!tempChgkQuestionsCount || !tempChgkRoundsCount)}
                                    onClick={() => {
                                        setChgkSettings(prevValue => {
                                            return {
                                                questionsCount: tempChgkQuestionsCount || prevValue?.questionsCount || 0,
                                                roundsCount: tempChgkRoundsCount || prevValue?.roundsCount || 0,
                                                questions: tempChgkQuestions || prevValue?.questions || {}
                                            };
                                        });
                                        setTempChgkQuestionsCount(undefined);
                                        setTempChgkRoundsCount(undefined);
                                        setTempChgkQuestions(undefined);
                                        setPage(GameCreationPages.Main);
                                    }}>
                                {props.mode === GameCreatorMode.edit ? 'Сохранить' : 'Создать'}
                            </button>

                            <button type='button' className={`${classes.button} ${classes.defaultButton}`} onClick={() => {
                                setTempChgkRoundsCount(undefined);
                                setTempChgkQuestionsCount(undefined);
                                setTempChgkQuestions(undefined);
                                setPage(GameCreationPages.Main);
                            }}>
                                Отменить
                            </button>
                        </div>
                    </div>
                );
            case GameCreationPages.ChgkQuestions:
                return (
                    <div className={classes.questionsWrapper}>
                        <p className={classes.gameSettingsPageTitle}>ЧГК</p>

                        <div className={classes.questionInputsWrapper}>
                            <Scrollbar>
                                {
                                    renderChgkQuestionInputs()
                                }
                            </Scrollbar>
                        </div>

                        <div className={classes.buttonsWrapper}>
                            <button type='submit' className={`${classes.button} ${classes.primaryButton}`} onClick={() => {
                                setIsSaveChgkQuestions(true);
                                setPage(GameCreationPages.ChgkSettings);
                            }}>
                                Сохранить
                            </button>

                            <button type='button' className={`${classes.button} ${classes.defaultButton}`} onClick={() => {
                                if (!isSaveChgkQuestions) {
                                    setTempChgkQuestions(undefined);
                                }

                                setPage(GameCreationPages.ChgkSettings);
                            }}>
                                Отменить
                            </button>
                        </div>
                    </div>
                );
            case GameCreationPages.MatrixSettings:
                return (
                    <div className={classes.pageWrapper}>
                        <p className={classes.gameSettingsPageTitle}>Матрица</p>

                        <div className={classes.gameParamsWrapper}>
                            <div className={classes.toursCountWrapper}>
                                <label htmlFor="toursCount" className={classes.toursCountLabel}>Количество
                                    туров</label>
                                <input className={classes.toursCountInput}
                                       type="text"
                                       id="toursCount"
                                       name="toursCount"
                                       value={tempMatrixRoundsCount || ''}
                                       placeholder='30'
                                       required={true}
                                       onChange={(event) => handleToursCountChange(event, GameTypeMode.matrix)}
                                />
                            </div>

                            <div className={classes.questionsCountWrapper}>
                                <label htmlFor="questionsCount" className={classes.questionsCountLabel}>Вопросов в
                                    туре</label>
                                <input className={classes.questionsCountInput}
                                       type="text"
                                       id="questionsCount"
                                       name="questionsCount"
                                       value={tempMatrixQuestionsCount || ''}
                                       placeholder='30'
                                       required={true}
                                       onChange={(event) => handleQuestionsCountChange(event, GameTypeMode.matrix)}
                                />
                            </div>
                        </div>

                        <div className={classes.gameParamsButtonsWrapper}>
                            <button className={`${classes.button} ${classes.primaryButton}`}
                                    disabled={!tempMatrixQuestionsCount || !tempMatrixRoundsCount}
                                    onClick={() => {
                                        setTempMatrixRoundNames(prevValue => {
                                            return Array.from(Array(tempMatrixRoundsCount).keys()).map((i) => prevValue?.[i] || matrixSettings?.roundNames?.[i] || '')
                                        });
                                        setPage(GameCreationPages.MatrixTours);
                                    }}>
                                Далее
                            </button>

                            <button type='button' className={`${classes.button} ${classes.defaultButton}`} onClick={() => {
                                setTempMatrixQuestionsCount(undefined);
                                setTempMatrixRoundsCount(undefined);
                                setTempMatrixRoundNames(undefined);
                                setTempMatrixQuestions(undefined);
                                setPage(GameCreationPages.Main);
                            }}>
                                Отменить
                            </button>
                        </div>
                    </div>
                );
            case GameCreationPages.MatrixTours:
                return (
                    <div className={classes.pageWrapper}>
                        <p className={classes.gameSettingsPageTitle}>Матрица</p>

                        <div className={classes.tourNamesWrapper}>
                            <Scrollbar>
                                {
                                    renderRoundNameInputs(GameTypeMode.matrix)
                                }
                            </Scrollbar>

                            {
                                submitted && tempMatrixRoundNames?.filter(n => n === '').length
                                    ? <small style={{
                                        position: 'absolute',
                                        color: '#FF0000',
                                        bottom: '-7%',
                                        left: 0,
                                        fontSize: '1vmax'
                                    }}>Введите названия для всех туров</small>
                                    : null
                            }
                        </div>
                        <div className={classes.matrixQuestionsWrapper}>
                            <button className={`${classes.button} ${classes.defaultButton}`}
                                    disabled={!!(tempMatrixRoundNames?.filter(n => n === '').length)}
                                    onClick={() => {
                                        if (!tempMatrixQuestions || !Object.values(tempMatrixQuestions).length) {
                                            const questions: Record<number, string[]> = {};
                                            for (let i = 0; i < (tempMatrixRoundsCount || 0); i++) {
                                                questions[i + 1] = new Array(tempMatrixQuestionsCount as number).fill('');
                                            }
                                            setTempMatrixQuestions(questions);
                                        }
                                        setPage(GameCreationPages.MatrixQuestions);
                                    }}>
                                Добавить вопросы в игру
                            </button>
                        </div>

                        <div className={classes.gameParamsButtonsWrapper}>
                            <button className={`${classes.button} ${classes.primaryButton}`} onClick={() => {
                                if (!tempMatrixRoundNames?.filter(n => n === '').length) {
                                    setMatrixSettings(prevValue => {
                                        return {
                                            questionsCount: tempMatrixQuestionsCount || 0,
                                            roundsCount: tempMatrixRoundsCount || 0,
                                            roundNames: tempMatrixRoundNames || prevValue?.roundNames || [],
                                            questions: tempMatrixQuestions || prevValue?.questions || {}
                                        };
                                    });
                                    setIsSaveMatrixTours(true);
                                    setTempMatrixRoundsCount(undefined);
                                    setTempMatrixQuestionsCount(undefined);
                                    setTempMatrixQuestions(undefined);
                                    setTempMatrixRoundNames(undefined);
                                    setPage(GameCreationPages.Main);
                                    setSubmitted(false);
                                } else {
                                    setSubmitted(true);
                                }
                            }}>
                                {props.mode === GameCreatorMode.edit ? 'Сохранить' : 'Создать'}
                            </button>

                            <button type='button' className={`${classes.button} ${classes.defaultButton}`} onClick={() => {
                                if (!isSaveMatrixTours) {
                                    setTempMatrixRoundNames(undefined);
                                    setTempMatrixQuestions(undefined);
                                }

                                setPage(GameCreationPages.MatrixSettings);
                            }}>
                                Назад
                            </button>
                        </div>
                    </div>
                );
            case GameCreationPages.MatrixQuestions:
                return (
                    <div className={classes.questionsWrapper}>
                        <p className={classes.gameSettingsPageTitle}>Матрица</p>

                        <div className={classes.questionInputsWrapper}>
                            <Scrollbar>
                                {renderMatrixQuestionInputs()}
                            </Scrollbar>
                        </div>

                        <div className={classes.buttonsWrapper}>
                            <button type='submit' className={`${classes.button} ${classes.primaryButton}`} onClick={() => {
                                setPage(GameCreationPages.MatrixTours);
                                setIsSaveMatrixQuestions(true);
                            }}>
                                Сохранить
                            </button>

                            <button type='button' className={`${classes.button} ${classes.defaultButton}`} onClick={() => {
                                if (!isSaveMatrixQuestions) {
                                    setTempMatrixQuestions(undefined);
                                }
                                setPage(GameCreationPages.MatrixTours);
                            }}>
                                Отменить
                            </button>
                        </div>
                    </div>
                );
            case GameCreationPages.QuizSettings:
                return (
                    <div className={classes.pageWrapper}>
                        <p className={classes.gameSettingsPageTitle}>Квиз</p>

                        <div className={classes.gameParamsWrapper}>
                            <div className={classes.toursCountWrapper}>
                                <label htmlFor="toursCount" className={classes.toursCountLabel}>
                                    Количество туров
                                </label>
                                <input className={classes.toursCountInput}
                                       type="text"
                                       id="toursCount"
                                       name="toursCount"
                                       value={tempQuizRoundsCount || ''}
                                       placeholder='30'
                                       required={true}
                                       onChange={(event) => handleToursCountChange(event, GameTypeMode.quiz)}
                                />
                            </div>

                            <div className={classes.questionsCountWrapper}>
                                <label htmlFor="questionsCount" className={classes.questionsCountLabel}>
                                    Вопросов в туре
                                </label>
                                <input className={classes.questionsCountInput}
                                       type="text"
                                       id="questionsCount"
                                       name="questionsCount"
                                       value={tempQuizQuestionsCount || ''}
                                       placeholder='30'
                                       required={true}
                                       onChange={(event) => handleQuestionsCountChange(event, GameTypeMode.quiz)}
                                />
                            </div>
                        </div>

                        <div className={classes.gameParamsButtonsWrapper}>
                            <button className={`${classes.button} ${classes.primaryButton}`}
                                    disabled={!tempQuizQuestionsCount || !tempQuizRoundsCount}
                                    onClick={() => {
                                        setTempQuizRoundNames(prevValue => {
                                            return Array.from(
                                                Array(tempQuizRoundsCount).keys())
                                                .map((i) =>
                                                    prevValue?.[i] || quizSettings?.roundNames?.[i] || ''
                                                )
                                        });
                                        setPage(GameCreationPages.QuizTours);
                                    }}>
                                Далее
                            </button>

                            <button type='button' className={`${classes.button} ${classes.defaultButton}`} onClick={() => {
                                setTempQuizQuestionsCount(undefined);
                                setTempQuizRoundsCount(undefined);
                                setTempQuizRoundNames(undefined);
                                setTempQuizRoundTypes([RoundType.NORMAL]);
                                setTempQuizQuestions(undefined);
                                setPage(GameCreationPages.Main);
                            }}>
                                Отменить
                            </button>
                        </div>
                    </div>
                );
            case GameCreationPages.QuizTours:
                return (
                    <div className={classes.pageWrapper}>
                        <p className={classes.gameSettingsPageTitle}>Квиз</p>

                        <div className={classes.tourNamesWrapper}>
                            <Scrollbar>
                                {
                                    renderRoundNameInputs(GameTypeMode.quiz)
                                }
                            </Scrollbar>

                            {
                                submitted && tempMatrixRoundNames?.filter(n => n === '').length
                                    ? <small style={{
                                        position: 'absolute',
                                        color: '#FF0000',
                                        bottom: '-7%',
                                        left: 0,
                                        fontSize: '1vmax'
                                    }}>Введите названия для всех туров</small>
                                    : null
                            }
                        </div>
                        <div className={classes.matrixQuestionsWrapper}>
                            <button className={`${classes.button} ${classes.defaultButton}`}
                                    disabled={!!(tempQuizRoundNames?.filter(n => n === '').length)}
                                    onClick={() => {
                                        if (!tempQuizQuestions || !Object.values(tempQuizQuestions).length) {
                                            const questions: Record<number, string[]> = {};
                                            for (let i = 0; i < (tempQuizRoundsCount || 0); i++) {
                                                questions[i + 1] = new Array(tempQuizQuestionsCount as number).fill('');
                                            }
                                            setTempQuizQuestions(questions);
                                        }
                                        setPage(GameCreationPages.QuizQuestions);
                                    }}>
                                Добавить вопросы в игру
                            </button>
                        </div>

                        <div className={classes.gameParamsButtonsWrapper}>
                            <button className={`${classes.button} ${classes.primaryButton}`} onClick={() => {
                                if (!tempQuizRoundNames?.filter(n => n === '').length) {
                                    setQuizSettings(prevValue => {
                                        return {
                                            questionsCount: tempQuizQuestionsCount || 0,
                                            roundsCount: tempQuizRoundsCount || 0,
                                            roundNames: tempQuizRoundNames || prevValue?.roundNames || [],
                                            roundTypes: tempQuizRoundTypes || prevValue?.roundTypes || [],
                                            questions: tempQuizQuestions || prevValue?.questions || {}
                                        };
                                    });
                                    setIsSaveQuizTours(true);
                                    setTempQuizRoundsCount(undefined);
                                    setTempQuizQuestionsCount(undefined);
                                    setTempQuizQuestions(undefined);
                                    setTempQuizRoundNames(undefined);
                                    setTempQuizRoundTypes([RoundType.NORMAL]);
                                    setPage(GameCreationPages.Main);
                                    setSubmitted(false);
                                } else {
                                    setSubmitted(true);
                                }
                            }}>
                                {props.mode === GameCreatorMode.edit ? 'Сохранить' : 'Создать'}
                            </button>

                            <button type='button' className={`${classes.button} ${classes.defaultButton}`} onClick={() => {
                                if (!isSaveQuizTours) {
                                    setTempQuizRoundNames(undefined);
                                    setTempQuizRoundTypes([RoundType.NORMAL]);
                                    setTempQuizQuestions(undefined);
                                }

                                setPage(GameCreationPages.QuizSettings);
                            }}>
                                Назад
                            </button>
                        </div>
                    </div>
                );
            case GameCreationPages.QuizQuestions:
                return (
                    <div className={classes.questionsWrapper}>
                        <p className={classes.gameSettingsPageTitle}>Квиз</p>

                        <div className={classes.questionInputsWrapper}>
                            <Scrollbar>
                                {renderQuizQuestionInputs()}
                            </Scrollbar>
                        </div>

                        <div className={classes.buttonsWrapper}>
                            <button type='submit' className={`${classes.button} ${classes.primaryButton}`} onClick={() => {
                                setPage(GameCreationPages.QuizTours);
                                setIsSaveQuizQuestions(true);
                            }}>
                                Сохранить
                            </button>

                            <button type='button' className={`${classes.button} ${classes.defaultButton}`} onClick={() => {
                                if (!isSaveQuizQuestions) {
                                    setTempQuizQuestions(undefined);
                                }
                                setPage(GameCreationPages.QuizTours);
                            }}>
                                Отменить
                            </button>
                        </div>
                    </div>
                );
        }
    }

    if (isPageLoading) {
        return <Loader/>;
    }

    if (isCancelled) {
        return <Redirect to={{pathname: '/admin/start-screen', state: {page: 'games'}}}/>
    }

    return isCreatedSuccessfully
        ? <Redirect to={{pathname: props.isAdmin ? '/admin/start-screen' : '/start-screen', state: {page: 'games'}}}/>
        :
        (
            <PageWrapper>
                <Header isAuthorized={true} isAdmin={true}>
                    <NavBar isAdmin={props.isAdmin} page=''/>
                </Header>
                {
                    renderPage()
                }
                <PageBackdrop isOpen={isLoading}/>
                {
                    isDeleteChgkModalVisible
                        ? <Modal
                            modalType='delete-game-part'
                            itemForDeleteName='ЧГК из игры'
                            setGamePartUndefined={setChgkSettings}
                            closeModal={setIsDeleteChgkModalVisible}
                        />
                        : null
                }
                {
                    isDeleteMatrixModalVisible
                        ? <Modal
                            modalType='delete-game-part'
                            itemForDeleteName='матрицу из игры'
                            setGamePartUndefined={setMatrixSettings}
                            closeModal={setIsDeleteMatrixModalVisible}
                        />
                        : null
                }
                {
                    isDeleteQuizModalVisible
                        ? <Modal
                            modalType='delete-game-part'
                            itemForDeleteName='квиз из игры'
                            setGamePartUndefined={setQuizSettings}
                            closeModal={setIsDeleteQuizModalVisible}
                        />
                        : null
                }
            </PageWrapper>
        );
};

export default GameCreator;