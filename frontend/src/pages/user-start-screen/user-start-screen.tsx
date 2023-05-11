import React, {FC, useEffect, useState} from 'react';
import classes from './user-start-screen.module.scss';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import NavBar from '../../components/nav-bar/nav-bar';
import Header from '../../components/header/header';
import {
    UserStartScreenDispatchProps,
    UserStartScreenProps
} from '../../entities/user-start-screen/user-start-screen.interfaces';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import {Link, Redirect, useLocation} from 'react-router-dom';
import {Alert, IconButton, Skeleton, Snackbar} from '@mui/material';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import {
    changeToken,
    editTeamCaptainByCurrentUser,
    getAmIParticipateGames,
    getTeamByCurrentUser,
    getTeamsWithoutUser
} from '../../server-api/server-api';
import {Game, Team} from '../admin-start-screen/admin-start-screen';
import Scrollbar from '../../components/scrollbar/scrollbar';
import {Dispatch} from 'redux';
import {AppAction} from '../../redux/reducers/app-reducer/app-reducer.interfaces';
import {addUserTeam} from '../../redux/actions/app-actions/app-actions';
import {connect} from 'react-redux';
import MobileNavbar from '../../components/mobile-navbar/mobile-navbar';
import Loader from '../../components/loader/loader';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GameItem, {Roles} from "../../components/game-item/game-item";
import CustomButton, {ButtonType} from "../../components/custom-button/custom-button";
import {AddRounded} from "@mui/icons-material";
import TeamItem, {Participant} from "../../components/team-item/team-item";

const UserStartScreen: FC<UserStartScreenProps> = props => {
    const [page, setPage] = useState<string>('teams');
    const [gamesFromDB, setGamesFromDB] = useState<Game[]>();
    const [teamsFromDB, setTeamsFromDB] = useState<Team[]>();
    const [userTeam, setUserTeam] = useState<Team>({
        captainEmail: "",
        captainId: "",
        participantsCount: 0,
        participants: [],
        name: '', id: ''});
    const [gameId, setGameId] = useState<string>('');
    const [isTeamNotFree, setIsTeamNotFree] = useState<boolean>(false);
    const [numberLoading, setNumberLoading] = useState<number>(0);
    const [isClickedOnCurrentTeam, setIsClickedOnCurrentTeam] = useState<boolean>(false);
    let location = useLocation<{ page: string }>();
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
        if (location.state !== undefined) {
            setPage(location.state.page);
        }
    }, [location]);

    useEffect(() => {
        getTeamByCurrentUser().then(res => {
            if (res.status === 200) {
                res.json().then((team) => {
                    if (team.name !== undefined) {
                        setUserTeam(team);
                        setTeamsFromDB([team]);
                        setNumberLoading(prev => Math.min(prev + 1, 2));
                    } else {
                        getTeamsWithoutUser().then(res => {
                            if (res.status === 200) {
                                res.json().then(({teams}) => {
                                    setTeamsFromDB(teams.sort((team1: Team, team2: Team) => team1.name.toLowerCase() > team2.name.toLowerCase() ? 1 : -1));
                                    setNumberLoading(prev => Math.min(prev + 1, 2));
                                });
                            } else {
                                // TODO: код не 200, мейби всплывашку, что что-то не так?
                            }
                        });
                    }
                });
            }
        });

        getAmIParticipateGames().then(res => {
            if (res.status === 200) {
                res.json().then(({games}) => {
                    setGamesFromDB(games.sort((game1: Game, game2: Game) => game1.name.toLowerCase() > game2.name.toLowerCase() ? 1 : -1));
                    setNumberLoading(prev => Math.min(prev + 1, 2));
                });
            } else {
                // TODO: код не 200, мейби всплывашку, что что-то не так?
            }
        });
    }, []);

     const handleChooseTeam = (team: Team) => {
        if (userTeam.name === '') {
            editTeamCaptainByCurrentUser(team.id)
                .then(res => {
                    if (res.status === 200) {
                        setUserTeam({
                            name: team.name,
                            id: team.id,
                            captainEmail: team.captainEmail,
                            captainId: team.captainId,
                            participantsCount: team.participantsCount,
                            participants: team.participants
                        });
                        setIsTeamNotFree(false);
                        props.onAddUserTeam(team.name);
                        getAmIParticipateGames().then(res => {
                            if (res.status === 200) {
                                res.json().then(({games}) => {
                                    setGamesFromDB(games.sort((game1: Game, game2: Game) => game1.name.toLowerCase() > game2.name.toLowerCase() ? 1 : -1));
                                    setNumberLoading(prev => Math.min(prev + 1, 2));
                                });
                            } else {
                                // TODO: код не 200, мейби всплывашку, что что-то не так?
                            }
                        });
                        window.location.reload();
                    } else {
                        setTeamsFromDB(arr => arr?.filter(x => x.id != team.id));
                        setIsTeamNotFree(true);
                        setTimeout(() => setIsTeamNotFree(false), 5000);
                    }
                });
        }
    };

    const handleClickOnGame = (id: string) => {
        changeToken(id).then((res) => {
            if (res.status === 200) {
                setGameId(id);
            }
        });
    };

    const handleEditClick = () => {
        setIsClickedOnCurrentTeam(true);
    };

    let isDisabledTeamButton = false;
    if (userTeam.id !== "") {
        isDisabledTeamButton = true;
    }

    const renderGames = () => {
        if (!gamesFromDB) {
            return Array.from(Array(5).keys()).map(i => <Skeleton key={`game_skeleton_${i}`} variant='rectangular' width='100%' height={mediaMatch.matches ? '5vh' : '7vh'} sx={{marginBottom: '2.5vh'}} />);
        }
        return gamesFromDB.map((game, index) =>
                <GameItem
                    key={index}
                    id={game.id}
                    name={game.name}
                    teamsCount={game.teamsCount}
                    status={game.status}
                    games={game.games}
                    role={Roles.user}
                    onClick={() => handleClickOnGame(game.id)}
                />);

    };

    const renderTeams = () => {
        if (!teamsFromDB) {
            return Array.from(Array(5).keys()).map(i => <Skeleton key={`team_skeleton_${i}`} variant='rectangular' width='100%' height={mediaMatch.matches ? '5vh' : '7vh'} sx={{marginBottom: '2.5vh'}} />);
        }

        return userTeam.name !== ''
            ? <TeamItem
                id={userTeam.id}
                name={userTeam.name}
                captainId={userTeam.captainId}
                captainEmail={userTeam.captainEmail}
                participants={userTeam.participants}
                participantsCount={userTeam.participantsCount}
                role={Roles.user}
                userTeam={userTeam}
            />
            :  teamsFromDB.map((team, index) =>
                <TeamItem
                    id={team.id}
                    name={team.name}
                    captainId={team.captainId}
                    captainEmail={team.captainEmail}
                    participants={team.participants}
                    participantsCount={team.participantsCount}
                    role={Roles.user}
                    userTeam={userTeam}
                    onClick={() => handleChooseTeam(team)}
                />);
    };

    const renderPage = (page: string) => {
        switch (page) {
            case 'games':
                return (
                    <div className={classes.sectionPage}>
                        <div className={classes.sectionHeader}>
                            <h1 className={classes.title}>Игры</h1>
                        </div>
                        {
                            gamesFromDB && !gamesFromDB.length
                            ?
                                <div className={classes.sectionListEmpty}>
                                    <img className={classes.emptyImage} src={require('../../images/owl-images/empty_owl.svg').default} alt="empty-owl"/>
                                    <h3 className={classes.emptyTitle}>Пока нет ни одной игры</h3>
                                </div>
                            :
                                <div className={classes.sectionList}>
                                    {renderGames()}
                                </div>
                        }
                    </div>
                );
            case 'teams':
                return (
                    <div className={classes.sectionPage}>
                        <div className={classes.sectionHeader}>
                            <h1 className={classes.title}>Команды</h1>
                            <Link
                                to={"/team-creation"}
                                className={classes.addButtonWrapper}
                                style={{pointerEvents: isDisabledTeamButton ? 'none' : 'auto'}}
                            >
                                <CustomButton
                                    disabled={isDisabledTeamButton}
                                    type={"button"}
                                    text={"Создать команду"}
                                    buttonType={ButtonType.primary}
                                    startIcon={<AddRounded fontSize={'large'}
                                    sx={{
                                        fontSize: '3rem'
                                    }}/>}
                                />
                            </Link>
                        </div>
                        {
                            teamsFromDB && !teamsFromDB.length
                                ?
                                <div className={classes.sectionListEmpty}>
                                    <img className={classes.emptyImage} src={require('../../images/owl-images/empty_owl.svg').default} alt="empty-owl"/>
                                    <h3 className={classes.emptyTitle}>Нет ни одной свободной команды<br/>Создайте свою</h3>
                                </div>
                                :
                                <div className={classes.sectionList}>
                                    {renderTeams()}
                                </div>
                        }
                        <Snackbar sx={{marginTop: '8vh'}} open={isTeamNotFree} anchorOrigin={{vertical: 'top', horizontal: 'right'}} autoHideDuration={5000}>
                            <Alert severity='error' sx={{width: '100%'}}>
                                Кто-то уже занял эту команду
                            </Alert>
                        </Snackbar>
                    </div>
                );
        }
    };

    if (numberLoading < 2) {
        return <Loader />;
    }

    if (isClickedOnCurrentTeam) {
        return <Redirect to={{pathname: `/team-creation/edit`, state: {id: userTeam.id, name: userTeam.name}}}/>
    }

    if (gameId) {
        return <Redirect to={`/game/${gameId}`}/>;
    }

    return (
        <PageWrapper>
            <Header isAuthorized={true} isAdmin={false}>
                {
                    !mediaMatch.matches
                        ? <NavBar isAdmin={false} page={location.state !== undefined ? location.state.page : page}
                         onLinkChange={setPage}/>
                        : null
                }
            </Header>

            {
                mediaMatch.matches
                    ? <MobileNavbar isAdmin={false} page={page} onLinkChange={setPage} isGame={false} />
                    : null
            }
            {renderPage(page)}
        </PageWrapper>
    );
};

function mapDispatchToProps(dispatch: Dispatch<AppAction>): UserStartScreenDispatchProps {
    return {
        onAddUserTeam: (team: string) => dispatch(addUserTeam(team))
    };
}

export default connect(null, mapDispatchToProps)(UserStartScreen);
