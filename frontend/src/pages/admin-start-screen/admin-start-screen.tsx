import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import classes from './admin-start-screen.module.scss';
import Header from '../../components/header/header';
import NavBar from '../../components/nav-bar/nav-bar';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import { AdminStartScreenProps } from '../../entities/admin-start-screen/admin-start-screen.interfaces';
import { Button, IconButton, OutlinedInput, Skeleton } from '@mui/material';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import { Scrollbars } from 'rc-scrollbars';
import { Link, useLocation } from 'react-router-dom';
import { ServerApi } from '../../server-api/server-api';
import Modal from '../../components/modal/modal';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import Scrollbar from '../../components/scrollbar/scrollbar';
import Loader from '../../components/loader/loader';
import { AddRounded } from '@mui/icons-material';
import GameItem, { AccessLevel, Roles, Status } from '../../components/game-item/game-item';
import CustomButton, { ButtonType } from '../../components/custom-button/custom-button';
import { GameTypeItemProps } from '../../components/game-type-item/game-type-item';
import TeamItem, { Participant } from '../../components/team-item/team-item';
import emptyOwlImage from '../../images/owl-images/empty_owl.svg';

const inputStyles = {
    '& .MuiOutlinedInput-notchedOutline': {
        border: '2px solid var(--foreground-color) !important',
        borderRadius: '8px',
        minHeight: '26px',
        padding: '0 !important',
    },
    '& .MuiOutlinedInput-input': {
        padding: '0 0 0 1.5vw !important',
        color: 'black',
    },
};

interface Admin {
    name: string;
    email: string;
    id?: string;
}

interface AdminProps {
    name: string;
    email: string;
    deleteAdmin?: Dispatch<SetStateAction<Admin[] | undefined>>;
    isSuperAdmin: boolean;
}

const AdminComponent: React.FC<AdminProps> = props => {
    const handleDelete = useCallback(() => {
        ServerApi.deleteAdmin(props.email).then(res => {
            if (res.status === 200) {
                props.deleteAdmin?.(admins => admins?.filter(a => a.email !== props.email));
            } else {
                // TODO: код не 200, мейби всплывашку, что что-то не так?
            }
        });
    }, [props]);

    const handleDeleteClick = () => {
        handleDelete();
    };

    return (
        <div className={props.isSuperAdmin ? classes.superAdminInfoWrapper : classes.adminInfoWrapper}>
            <OutlinedInput
                readOnly
                sx={inputStyles}
                className={`${classes.adminName} ${classes.adminInput}`}
                value={props.name}
            />
            <OutlinedInput
                readOnly
                sx={inputStyles}
                className={`${classes.adminEmail} ${classes.adminInput}`}
                value={props.email}
            />
            {props.isSuperAdmin ? (
                <Button
                    className={classes.adminButton}
                    onClick={handleDeleteClick}
                >
                    <CloseIcon sx={{ color: 'red', fontSize: '5vmin' }} />
                </Button>
            ) : null}
        </div>
    );
};

export interface Game {
    id: string;
    name: string;
    teamsCount: number;
    status: Status;
    accessLevel: AccessLevel;
    amIParticipate: boolean;
    games: GameTypeItemProps[];
}

export interface Team {
    name: string;
    id: string;
    captainEmail: string;
    captainId: string;
    participantsCount: number;
    participants: Participant[];
}

export interface User {
    name: string;
    id?: string;
    email: string;
}

const AdminStartScreen: React.FC<AdminStartScreenProps> = props => {
    const [page, setPage] = useState<string>('games');
    const [teams, setTeams] = useState<Team[]>();
    const [games, setGames] = useState<Game[]>();
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [deletedItemName, setDeletedItemName] = useState<string>('');
    const [deletedItemId, setDeletedItemId] = useState<string>('');
    const [admins, setAdmins] = useState<Admin[]>();
    const [newAdmin, setNewAdmin] = useState<Admin | null>(null);
    const [isEmailInvalid, setIsEmailInvalid] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const scrollbars = useRef<Scrollbars>(null);
    const location = useLocation<{ page: string }>();

    if (teams && games && admins && isLoading) {
        setIsLoading(false);
    }

    const emailStyles = {
        '& .MuiOutlinedInput-notchedOutline': {
            border: isEmailInvalid ? '2px solid #FF0000 !important' : '2px solid var(--foreground-color) !important',
            borderRadius: '8px',
            minHeight: '26px',
            padding: '0 !important',
        },
        '& .MuiOutlinedInput-input': {
            padding: '0 0 0 1.5vw !important',
            color: 'black',
        },
    };

    useEffect(() => {
        if (location.state !== undefined) {
            setPage(location.state.page);
        }
    }, [location]);

    useEffect(() => {
        ServerApi.getAll('teams').then(res => {
            if (res.status === 200) {
                res.json().then(({ teams }) => {
                    setTeams(
                        teams.sort((team1: Team, team2: Team) =>
                            team1.name.toLowerCase() > team2.name.toLowerCase() ? 1 : -1,
                        ),
                    );
                });
            } else {
                // TODO: обработать ошибку
            }
        });

        ServerApi.getAll('games').then(res => {
            if (res.status === 200) {
                res.json().then(({ games }) => {
                    setGames(
                        games.sort((game1: Game, game2: Game) =>
                            game1.name.toLowerCase() > game2.name.toLowerCase() ? 1 : -1,
                        ),
                    );
                });
            } else {
                // TODO: обработать ошибку
            }
        });

        ServerApi.getAll('admins').then(res => {
            if (res.status === 200) {
                res.json().then(({ admins }) => {
                    setAdmins(
                        admins.sort((admin1: Admin, admin2: Admin) =>
                            admin1.email.toLowerCase() > admin2.email.toLowerCase() ? 1 : -1,
                        ),
                    );
                });
            } else {
                // TODO: обработать ошибку
            }
        });
    }, []);

    const renderTeams = () => {
        if (!teams) {
            return Array.from(Array(5).keys()).map(i => (
                <Skeleton
                    key={`team_skeleton_${i}`}
                    variant='rectangular'
                    width='100%'
                    height='7vh'
                    sx={{ marginBottom: '2.5vh' }}
                />
            ));
        }
        return teams.map(team => (
            <TeamItem
                id={team.id}
                name={team.name}
                captainId={team.captainId}
                captainEmail={team.captainEmail}
                participants={team.participants}
                participantsCount={team.participantsCount}
                openModal={setIsModalVisible}
                setItemForDeleteName={setDeletedItemName}
                setItemForDeleteId={setDeletedItemId}
                role={Roles.admin}
            />
        ));
    };

    const renderGames = () => {
        if (!games) {
            return Array.from(Array(5).keys()).map(i => (
                <Skeleton
                    key={`game_skeleton_${i}`}
                    variant='rectangular'
                    width='100%'
                    height='7vh'
                    sx={{ marginBottom: '2.5vh' }}
                />
            ));
        }
        return games.map(game => (
            <GameItem
                key={game.id}
                id={game.id}
                name={game.name}
                teamsCount={game.teamsCount}
                status={game.status}
                games={game.games}
                openModal={setIsModalVisible}
                setItemForDeleteName={setDeletedItemName}
                setItemForDeleteId={setDeletedItemId}
                accessLevel={game.accessLevel}
                amIParticipate={game.amIParticipate}
                role={Roles.admin}
            />
        ));
    };

    const renderAdmins = () => {
        if (!admins) {
            return Array.from(Array(5).keys()).map(i => (
                <div
                    key={`admin_skeleton_${i}`}
                    className={props.isSuperAdmin ? classes.superAdminInfoWrapper : classes.adminInfoWrapper}
                >
                    <Skeleton
                        variant='rectangular'
                        width='38%'
                        height='7vh'
                        sx={{ marginBottom: '2vh', marginRight: !props.isSuperAdmin ? '2%' : 0 }}
                    />
                    <Skeleton
                        variant='rectangular'
                        width='52%'
                        height='7vh'
                        sx={{ marginBottom: '2vh', marginRight: !props.isSuperAdmin ? '2%' : 0 }}
                    />
                    {props.isSuperAdmin ? (
                        <Skeleton
                            variant='rectangular'
                            width='7%'
                            height='7vh'
                            sx={{ marginBottom: '2vh' }}
                        />
                    ) : null}
                </div>
            ));
        }
        const adminsForRender = [];
        for (const admin of admins) {
            adminsForRender.push(
                <AdminComponent
                    key={admin.email + admin.name}
                    name={admin.name}
                    email={admin.email}
                    deleteAdmin={setAdmins}
                    isSuperAdmin={props.isSuperAdmin}
                />,
            );
        }
        return adminsForRender;
    };

    const handleAddAdminButton = () => {
        setNewAdmin({ name: '', email: '' });
    };

    useEffect(() => {
        if (newAdmin !== null) {
            scrollToBottom();
        }
    }, [newAdmin]);

    const scrollToBottom = () => {
        (scrollbars.current as Scrollbars).scrollToBottom();
    };

    const handleAddNewAdmin = () => {
        const newAdminName = document.querySelector('#new-admin-name') as HTMLInputElement;
        const newAdminEmail = document.querySelector('#new-admin-email') as HTMLInputElement;
        if (newAdminEmail.value !== '') {
            ServerApi.addAdmin(newAdminEmail.value, newAdminName.value).then(res => {
                if (res.status === 200) {
                    setAdmins(admins => [
                        ...(admins ? admins : []),
                        {
                            name: newAdminName.value,
                            email: newAdminEmail.value,
                        },
                    ]);
                    setNewAdmin(null);
                    setIsEmailInvalid(false);
                } else {
                    setIsEmailInvalid(true);
                }
            });
        } else {
            setIsEmailInvalid(true);
        }
    };

    let isDisabledGameButton = false;
    if (games) {
        isDisabledGameButton = props.role === 'demoadmin' && games.length >= 1;
    }

    let isDisabledTeamButton = false;
    if (teams) {
        isDisabledTeamButton = props.role === 'demoadmin' && teams.length >= 1;
    }

    const renderPage = (page: string) => {
        switch (page) {
            case 'games':
                return (
                    <div className={classes.sectionPage}>
                        <div className={classes.sectionHeader}>
                            <h1 className={classes.title}>Игры</h1>
                            <Link
                                to={'/admin/game-creation'}
                                className={classes.addButtonWrapper}
                                style={{ pointerEvents: isDisabledGameButton ? 'none' : 'auto' }}
                            >
                                <CustomButton
                                    disabled={isDisabledGameButton}
                                    type={'button'}
                                    text={'Создать игру'}
                                    buttonType={ButtonType.primary}
                                    startIcon={<AddRounded fontSize={'large'} />}
                                />
                            </Link>
                        </div>
                        {games && !games.length ? (
                            <div className={classes.sectionListEmpty}>
                                <img
                                    className={classes.emptyImage}
                                    src={emptyOwlImage}
                                    alt='empty-owl'
                                />
                                <h3 className={classes.emptyTitle}>Пока нет ни одной игры</h3>
                            </div>
                        ) : (
                            <Scrollbar>
                                <div className={classes.sectionList}>{renderGames()}</div>
                            </Scrollbar>
                        )}
                    </div>
                );
            case 'teams':
                return (
                    <div className={classes.sectionPage}>
                        <div className={classes.sectionHeader}>
                            <h1 className={classes.title}>Команды</h1>
                            <Link
                                to={'/admin/team-creation'}
                                className={classes.addButtonWrapper}
                                style={{ pointerEvents: isDisabledTeamButton ? 'none' : 'auto' }}
                            >
                                <CustomButton
                                    id={'addTeamButton'}
                                    disabled={isDisabledTeamButton}
                                    type={'button'}
                                    text={'Создать команду'}
                                    buttonType={ButtonType.primary}
                                    startIcon={<AddRounded fontSize={'large'} />}
                                />
                            </Link>
                        </div>
                        {teams && !teams.length ? (
                            <div className={classes.sectionListEmpty}>
                                <img
                                    className={classes.emptyImage}
                                    src={emptyOwlImage}
                                    alt='empty-owl'
                                />
                                <h3 className={classes.emptyTitle}>Пока нет ни одной команды</h3>
                            </div>
                        ) : (
                            <Scrollbar>
                                <div className={classes.sectionList}>{renderTeams()}</div>
                            </Scrollbar>
                        )}
                    </div>
                );
            case 'admins':
                if (props.role === 'demoadmin') {
                    return <></>;
                }
                return (
                    <div className={classes.adminsWrapper}>
                        <div className={props.isSuperAdmin ? classes.box : `${classes.box} ${classes.adminBox}`}>
                            <div
                                className={
                                    props.isSuperAdmin ? classes.superAdminWrapper : classes.adminsWrapperWithScrollbar
                                }
                            >
                                <Scrollbars
                                    ref={scrollbars}
                                    className={classes.scrollbar}
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
                                    renderTrackHorizontal={props => (
                                        <div
                                            {...props}
                                            style={{ display: 'none' }}
                                        />
                                    )}
                                    classes={{ view: classes.scrollbarView }}
                                >
                                    {renderAdmins()}

                                    {newAdmin !== null ? (
                                        <div className={classes.superAdminNewAdminInfoWrapper}>
                                            <OutlinedInput
                                                id='new-admin-name'
                                                sx={inputStyles}
                                                className={`${classes.adminName} ${classes.adminInput} ${classes.newAdmin}`}
                                                placeholder='Имя'
                                            />
                                            <OutlinedInput
                                                id='new-admin-email'
                                                type='email'
                                                sx={emailStyles}
                                                className={`${classes.adminEmail} ${classes.adminInput} ${classes.newAdmin}`}
                                                placeholder='Email*'
                                            />
                                            <Button
                                                className={classes.adminButton}
                                                onClick={handleAddNewAdmin}
                                                id='addAdminButton'
                                            >
                                                <AddIcon sx={{ color: 'green', fontSize: '5vmin' }} />
                                            </Button>
                                        </div>
                                    ) : null}
                                </Scrollbars>
                            </div>

                            {props.isSuperAdmin ? (
                                <IconButton
                                    sx={{ padding: '13px' }}
                                    id='addAdmin'
                                    onClick={handleAddAdminButton}
                                >
                                    <AddCircleOutlineOutlinedIcon
                                        sx={{
                                            color: 'white',
                                            fontSize: '9vmin',
                                        }}
                                    />
                                </IconButton>
                            ) : null}
                        </div>
                    </div>
                );
        }
    };

    return isLoading ? (
        <Loader />
    ) : (
        <PageWrapper>
            <Header
                isAuthorized={true}
                isAdmin={true}
            >
                <NavBar
                    isAdmin={true}
                    page={location.state !== undefined ? location.state.page : page}
                    onLinkChange={setPage}
                />
            </Header>

            {isModalVisible ? (
                <Modal
                    modalType='delete'
                    deleteGame={setGames}
                    deleteTeam={setTeams}
                    closeModal={setIsModalVisible}
                    itemForDeleteName={deletedItemName}
                    itemForDeleteId={deletedItemId}
                    type={page === 'teams' ? 'team' : 'game'}
                />
            ) : null}

            {renderPage(page)}
        </PageWrapper>
    );
};

export default AdminStartScreen;
