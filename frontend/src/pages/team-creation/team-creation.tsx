import React, {FC, useEffect, useRef, useState} from 'react';
import classes from './team-creation.module.scss';
import Header from '../../components/header/header';
import {FormButton} from '../../components/form-button/form-button';
import {
    TeamCreatorDispatchProps,
    TeamCreatorProps,
    TeamCreatorStateProps
} from '../../entities/team-creation/team-creation.interfaces';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import {Alert, Autocomplete, Button, OutlinedInput, Skeleton, Snackbar, TextField} from '@mui/material';
import {CustomInput} from '../../components/custom-input/custom-input';
import {Redirect, useLocation} from 'react-router-dom';
import NavBar from '../../components/nav-bar/nav-bar';
import PageBackdrop from '../../components/backdrop/backdrop';
import {Dispatch} from 'redux';
import {AppAction} from '../../redux/reducers/app-reducer/app-reducer.interfaces';
import {addUserTeam} from '../../redux/actions/app-actions/app-actions';
import {connect} from 'react-redux';
import {AppState} from '../../entities/app/app.interfaces';
import MobileNavbar from '../../components/mobile-navbar/mobile-navbar';
import Loader from '../../components/loader/loader';
import CloseIcon from '@mui/icons-material/Close';
import {Scrollbars} from 'rc-scrollbars';
import {User} from '../admin-start-screen/admin-start-screen';
import {ServerApi} from "../../server-api/server-api";

export interface TeamMember {
    name: string;
    email: string;
}

const TeamCreator: FC<TeamCreatorProps> = props => {
    const [usersFromDB, setUsersFromDB] = useState<string[]>();
    const [isCreatedSuccessfully, setIsCreatedSuccessfully] = useState<boolean>(false);
    const [isNameInvalid, setIsNameInvalid] = useState<boolean>(false);
    const [isCaptainEmpty, setIsCaptainEmpty] = useState<boolean>(false);
    const [oldCaptain, setOldCaptain] = useState<string | undefined>();
    const location = useLocation<{ id: string, name: string }>();
    const [teamName, setTeamName] = useState<string>(props.mode === 'edit' ? location.state.name : '');
    const [captain, setCaptain] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isSaveError, setIsSaveError] = useState<boolean>(false);
    const scrollbars = useRef<Scrollbars>(null);
    const [mediaMatch, setMediaMatch] = useState<MediaQueryList>(window.matchMedia('(max-width: 600px)'));

    useEffect(() => {
        const resizeEventHandler = () => {
            setMediaMatch(window.matchMedia('(max-width: 600px)'));
        }

        mediaMatch.addEventListener('change', resizeEventHandler);

        return () => {
            mediaMatch.removeEventListener('change', resizeEventHandler);
        };
    }, []);

    useEffect(() => {
        if (!props.isAdmin || props.role === "demoadmin") {
            setCaptain(props.userEmail);
            setOldCaptain(props.userEmail);
            setUsersFromDB([props.userEmail]);
            if (props.mode === 'edit') {
                ServerApi.getTeam(location.state.id).then(res => {
                    if (res.status === 200) {
                        res.json().then(team => {
                            setMembers(team.participants ?? []);
                            setIsPageLoading(false);
                        })
                    }
                });
            } else {
                setIsPageLoading(false);
            }
        } else {
            ServerApi.getUsersWithoutTeam().then(res => {
                if (res.status === 200) {
                    res.json().then(({users}) => {
                        const userObjects = users as User[]
                        setUsersFromDB([...userObjects.map(user => user.email)]);
                        if (props.mode === 'edit') {
                            ServerApi.getTeam(location.state.id).then(res => {
                                if (res.status === 200) {
                                    res.json().then(team => {
                                        setCaptain(team.captainEmail);
                                        setOldCaptain(team.captainEmail);
                                        setMembers(team.participants ?? []);
                                        if (team.captainEmail) {
                                            setUsersFromDB([...userObjects.map(user => user.email), team.captainEmail]);
                                        }
                                        setIsPageLoading(false);
                                    });
                                }
                            });
                        } else {
                            setIsPageLoading(false);
                        }
                    });
                } else {
                    // TODO: код не 200, мейби всплывашку, что что-то не так?
                }
            });
        }
    }, []);

    const handleAutocompleteChange = (event: React.SyntheticEvent, value: string | null) => {
        setCaptain(value ? value as string : undefined);
        setIsCaptainEmpty(false);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTeamName(event.target.value);
        setIsNameInvalid(false);
    };

    const handleSubmit = async (event: React.SyntheticEvent) => {
        event.preventDefault();
        /*if (captain === undefined) {
            setIsCaptainEmpty(true);
            return;
        }*/
        setIsLoading(true);
        if (props.mode === 'creation') {
            ServerApi.createTeam(teamName, captain, members.filter(member => member.name !== "" || member.email !== "")).then(res => {
                if (res.status === 200) {
                    setIsCreatedSuccessfully(true);
                    if (!props.isAdmin) {
                        props.onAddUserTeam(teamName);
                    }
                } else if (res.status === 409) {
                    setIsLoading(false);
                    setIsNameInvalid(true);
                } else {
                    setIsSaveError(true);
                    setIsLoading(false);
                }
            });
        } else {
            ServerApi.editTeam(location.state.id, teamName, captain, members.filter(member => member.name !== "" || member.email !== "")).then(res => {
                if (res.status === 200) {
                    if (!props.isAdmin) {
                        props.onAddUserTeam(teamName);
                    }

                    setIsCreatedSuccessfully(true);
                } else if (res.status === 409) {
                    setIsLoading(false);
                    setIsNameInvalid(true);
                } else {
                    setIsSaveError(true);
                    setIsLoading(false);
                }
            });
        }
    };

    const addMember = () => {
        setMembers((prevMembers) => [...prevMembers, {name: '', email: ''}]);
        (scrollbars.current as Scrollbars).scrollToBottom();
    };

    const handleDeleteMemberClick = (index: number) => {
        setMembers((prevMembers) => prevMembers.filter((_, i) => i !== index));
    };

    const handleMemberNameChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        setMembers((members) => {
            const newMembers = [...members];
            newMembers[index].name = event.target.value;
            return newMembers;
        });
    };

    const handleMemberEmailChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        setMembers((members) => {
            const newMembers = [...members];
            newMembers[index].email = event.target.value;
            return newMembers;
        });
    };

    const renderMembers = () => {
        return members.map((member, index) => (
            <div className={classes.memberWrapper} style={{marginBottom: mediaMatch.matches ? (index === members.length - 1 ? '0' : '5vw') : '0'}}>
                <OutlinedInput className={`${classes.adminName} ${classes.adminInput}`}
                               sx={{
                                   '& .MuiOutlinedInput-notchedOutline': {
                                       border: '2px solid var(--foreground-color) !important'
                                   }
                               }}
                               onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleMemberNameChange(event, index)}
                               value={member.name} placeholder='Имя'/>
                <OutlinedInput className={`${classes.adminEmail} ${classes.adminInput}`}
                               type='email'
                               sx={{
                                   '& .MuiOutlinedInput-notchedOutline': {
                                       border: '2px solid var(--foreground-color) !important'
                                   }
                               }}
                               onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleMemberEmailChange(event, index)}
                               value={member.email} placeholder='Почта'/>
                               <button className={classes.adminButton}
                                            onClick={() => handleDeleteMemberClick(index)}
                                            type='button'
                                    >
                                                            {
                        mediaMatch.matches
                        ? 'Удалить'
                        : <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="28" height="28" rx="14" fill="white" fill-opacity="0.06"/>
                        <path d="M19.2496 8.75843C18.9246 8.43343 18.3996 8.43343 18.0746 8.75843L13.9996 12.8251L9.92461 8.7501C9.59961 8.4251 9.07461 8.4251 8.74961 8.7501C8.42461 9.0751 8.42461 9.6001 8.74961 9.9251L12.8246 14.0001L8.74961 18.0751C8.42461 18.4001 8.42461 18.9251 8.74961 19.2501C9.07461 19.5751 9.59961 19.5751 9.92461 19.2501L13.9996 15.1751L18.0746 19.2501C18.3996 19.5751 18.9246 19.5751 19.2496 19.2501C19.5746 18.9251 19.5746 18.4001 19.2496 18.0751L15.1746 14.0001L19.2496 9.9251C19.5663 9.60843 19.5663 9.0751 19.2496 8.75843Z" fill="#F1F3F9"/>
                        </svg>    
                        }

                                </button>
            </div>
        ));
    };

    if (isPageLoading) {
        return <Loader />;
    }

    return isCreatedSuccessfully
        ? <Redirect to={{pathname: props.isAdmin ? '/admin/start-screen' : '/start-screen', state: {page: 'teams'}}}/>
        :
        (
            <PageWrapper>
                <Header isAuthorized={true} isAdmin={true}>
                    {
                        !mediaMatch.matches
                            ? props.mode === 'creation'
                                ? <div className={classes.pageTitle}>Создание команды</div>
                                : <div className={classes.pageTitle}>Редактирование</div>
                            : null
                    }
                </Header>
                <form className={classes.teamCreationForm} onSubmit={handleSubmit}>
                    <div className={classes.contentWrapper}>
                        <div className={classes.settingsWrapper}>
                            {
                                usersFromDB
                                    ? <CustomInput type='text' id='teamName'
                                                   name='teamName'                                              
                                                   placeholder='Как называется команда?'
                                                   value={teamName}
                                                   defaultValue={teamName}
                                                   onChange={handleInputChange}
                                                   isInvalid={isNameInvalid}
                                                   onFocus={() => setIsNameInvalid(false)}
                                                   errorHelperText={'Такая команда уже существует'}
                                                />
                                    : <Skeleton variant='rectangular' width='100%'
                                                height={mediaMatch.matches ? '6vh' : '7vh'} sx={{marginBottom: '3%'}}/>
                            }
                        </div>

                        <div className={classes.captainWrapper}>
                            <div className={classes.membersLabel}>Капитан</div>
                            <div className={classes.captainSettings}>
                            <OutlinedInput className={`${classes.adminName} ${classes.adminInput}`}
                               sx={{
                                   '& .MuiOutlinedInput-notchedOutline': {
                                       border: '2px solid var(--foreground-color) !important'
                                   }
                               }}
                               placeholder='Имя'/>

                        {
                                usersFromDB
                                    ?
                                    <div style={{position: 'relative', width: mediaMatch.matches ? '100%' : '59%'}}>
                                        <Autocomplete disablePortal
                                                        fullWidth
                                                        id="captain"
                                                        options={usersFromDB || []}
                                                        defaultValue={oldCaptain}
                                                        onChange={handleAutocompleteChange}
                                                        disabled={!props.isAdmin && props.mode === 'creation' || props.role === "demoadmin"}
                                                        sx={{
                                                            fontSize: mediaMatch.matches ? '5.3vw' : '1.5vw',
                                                            minHeight: '26px',
                                                            height: mediaMatch.matches ? '10.4vw !important' : '5.6vh !important',
                                                            borderRadius: '4px',
                                                            backgroundColor: '#000B1D',
                                                            border: '2px solid #F1F3F929',
                                                            marginBottom: mediaMatch.matches ? '5%' : '0',
                                                            '& .MuiOutlinedInput-input': {
                                                                border: 'none',
                                                                fontFamily: 'Roboto, sans-serif',
                                                                color: '#FFFFFF',
                                                                fontSize:  mediaMatch.matches ? '4vw' : '1.5vw',
                                                            },
                                                            '& .MuiOutlinedInput-root': {
                                                                height: mediaMatch.matches ? '10.4vw !important' : '5.6vh !important',
                                                                minHeight: '26px',
                                                                padding: mediaMatch.matches ? '0 2vw 0 !important' : '0'
                                                            },
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                border: '2px solid var(--foreground-color) !important',
                                                                borderRadius: '8px',
                                                                minHeight: '26px',
                                                            },
                                                            '& .MuiSvgIcon-root': {
                                                                color: 'var(--background-color)'
                                                            },
                                                            '& .Mui-disabled': {
                                                                color: 'transparentF',
                                                                '-webkit-text-fill-color': '#FFFFFF'
                                                            }
                                                        }}
                                                        renderInput={(params) => <TextField {...params} placeholder="Капитан"/>}
                                        />
                                        {
                                            false // isCaptainEmpty - пока совсем убирать не будем
                                                ?
                                                <small style={{
                                                    position: 'absolute',
                                                    color: '#FF0000',
                                                    top: '7.5vh',
                                                    fontSize: '1vmax'
                                                }}>Выберите
                                                    капитана</small>
                                                : null
                                        }
                                    </div>
                                    : <Skeleton variant='rectangular' width='100%' height={mediaMatch.matches ? '6vh' : '7vh'} sx={{marginBottom: '3%'}} />
                            }
                            </div>
                        </div>

                        <div className={classes.membersWrapper}>
                            <div className={classes.membersPanel}>
                                <div className={classes.membersLabel}>Остальные знатоки</div>       
                                <button className={classes.button}
                                            onClick={addMember}
                                            disabled={members.length === 9}
                                            type='button'
                                    >
                                                            {
                        mediaMatch.matches
                            ? null
                            : <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.0003 6.83317H6.83366V10.9998C6.83366 11.4582 6.45866 11.8332 6.00033 11.8332C5.54199 11.8332 5.16699 11.4582 5.16699 10.9998V6.83317H1.00033C0.541992 6.83317 0.166992 6.45817 0.166992 5.99984C0.166992 5.5415 0.541992 5.1665 1.00033 5.1665H5.16699V0.999837C5.16699 0.541504 5.54199 0.166504 6.00033 0.166504C6.45866 0.166504 6.83366 0.541504 6.83366 0.999837V5.1665H11.0003C11.4587 5.1665 11.8337 5.5415 11.8337 5.99984C11.8337 6.45817 11.4587 6.83317 11.0003 6.83317Z" fill="#F1F3F9"/>
                    </svg>
                    }
                                        Добавить
                                </button>
                            </div>

                            <div className={classes.members}>
                                <Scrollbars autoHide autoHideTimeout={500}
                                            ref={scrollbars}
                                            autoHideDuration={200}
                                            renderThumbVertical={() =>
                                                <div style={{
                                                    backgroundColor: 'white',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}/>
                                            }
                                            renderTrackHorizontal={props => <div {...props} style={{display: 'none'}}/>}
                                            classes={{
                                                view: classes.scrollbarView,
                                                trackVertical: classes.verticalTrack
                                            }}>
                                    {renderMembers()}
                                </Scrollbars>
                            </div>
                        </div>
                        <div className={classes.buttonsWrapper}>
                            <FormButton id={"saveTeam"} text={props.mode === 'creation' ? 'Создать команду' : 'Сохранить команду'} disabled={props.isAdmin && (!usersFromDB || isCaptainEmpty)}
                                    style={{
                                        padding: mediaMatch.matches ? '0 2vw' : '0 2vw',
                                        fontSize: mediaMatch.matches ? '3.5vw' : '1.5vw',
                                        height: mediaMatch.matches ? '9vw' : '5vh',
                                        borderRadius: '8px',
                                        fontWeight: 700,
                                        marginTop: '0rem'
                                    }}/>
                            <button className={classes.button}
                                                onClick={addMember}
                                                disabled={members.length === 9}
                                                type='button'
                            >
                    
                                    Отменить
                            </button>
                        </div>
                    </div>
                </form>
                <PageBackdrop isOpen={isLoading}/>
                <Snackbar sx={{marginTop: '8vh'}} open={isSaveError}
                          anchorOrigin={{vertical: 'top', horizontal: 'right'}} autoHideDuration={5000} onClose={() => setIsSaveError(false)}>
                    <Alert severity='error' sx={{width: '100%'}} onClose={() => setIsSaveError(false)}>
                        Не удалось сохранить изменения
                    </Alert>
                </Snackbar>
            </PageWrapper>
        );
};

function mapStateToProps(state: AppState): TeamCreatorStateProps {
    return {
        userEmail: state.appReducer.user.email
    };
}

function mapDispatchToProps(dispatch: Dispatch<AppAction>): TeamCreatorDispatchProps {
    return {
        onAddUserTeam: (team: string) => dispatch(addUserTeam(team))
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(TeamCreator);
