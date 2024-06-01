import { DeleteRounded, EditRounded, PeopleAltRounded } from '@mui/icons-material';
import { GameTypeItemProps } from '../game-type-item/game-type-item';
import classes from './game-item.module.scss';
import GameTypeList from '../game-type-list/game-type-list';
import { IconButton } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { Link } from 'react-router-dom';
import SignUpToGameItem from '../sign-up-to-game-item/sign-up-to-game-item';
import { ServerApi } from '../../server-api/server-api';
import GameStatus from '../game-status/game-status';
import { Team } from '../../pages/admin-start-screen/admin-start-screen';

export enum Roles {
    user,
    admin,
    superAdmin,
}

export enum AccessLevel {
    PUBLIC = 'public',
    PRIVATE = 'private',
}

export enum Status {
    NotStarted = 'not_started',
    Started = 'started',
    Finished = 'finished',
}

interface GameItemProps {
    id: string;
    name: string;
    teamsCount: number;
    status: Status;
    games: GameTypeItemProps[];
    accessLevel: AccessLevel;
    amIParticipate: boolean;
    userTeam?: Team;
    openModal?: Dispatch<SetStateAction<boolean>>;
    setItemForDeleteName?: Dispatch<SetStateAction<string>>;
    setItemForDeleteId?: Dispatch<SetStateAction<string>>;
    role: Roles;
    onClick?: React.MouseEventHandler;
}

function GameItem(props: GameItemProps) {
    const [isRedirectedToEdit, setIsRedirectedToEdit] = useState(false);
    const [amIParticipate, setAmIParticipate] = useState(props.amIParticipate);
    const [teamsCount, setTeamsCount] = useState(props.teamsCount);
    const gameId = props.id;
    const linkToGame = props.role === Roles.user ? `/game/${props.id}` : `/admin/start-game/${props.id}`;

    function handleAddToGame() {
        ServerApi.addCurrentTeamInGame(gameId).then(res => {
            if (res.status === 200) {
                setAmIParticipate(true);
                res.json().then(({ teamsCount }) => {
                    setTeamsCount(teamsCount);
                });
            } else if (res.status === 403) {
                // добавить обработку
            }
        });
    }

    function handleOutOfGame() {
        ServerApi.deleteCurrentTeamFromGame(gameId).then(res => {
            if (res.status === 200) {
                setAmIParticipate(false);
                res.json().then(({ teamsCount }) => {
                    setTeamsCount(teamsCount);
                });
            } else if (res.status === 403) {
                // добавить обработку
            }
        });
    }

    const handleDeleteClick = () => {
        setItemName();
        handleOpenModal();
    };

    const renderGameTitle = () => {
        if (props.role === Roles.admin) {
            return (
                <Link
                    to={linkToGame}
                    className={classes.gameTitle}
                    id={gameId}
                >
                    {props.name}
                </Link>
            );
        } else if (props.role === Roles.user) {
            return props.amIParticipate ? (
                <Link
                    to={linkToGame}
                    className={classes.gameTitle}
                    id={gameId}
                >
                    {props.name}
                </Link>
            ) : (
                <div className={classes.gameTitle}>{props.name}</div>
            );
        } else {
            return <div className={classes.gameTitle}>{props.name}</div>;
        }
    };

    const setItemName = useCallback(() => {
        if (props.setItemForDeleteName) {
            props.setItemForDeleteName(props.name);
        }
        if (props.setItemForDeleteId) {
            props.setItemForDeleteId(props.id as string);
        }
    }, [props]);

    const handleOpenModal = useCallback(() => {
        if (props.openModal) {
            props.openModal(true);
        }
    }, [props]);

    const handleEditClick = () => {
        setIsRedirectedToEdit(true);
    };

    return isRedirectedToEdit ? (
        <Redirect to={{ pathname: '/admin/game-creation/edit', state: { id: props.id, name: props.name } }} />
    ) : (
        <div className={classes.gameContent}>
            {renderGameTitle()}
            <GameTypeList types={props.games} />
            <div className={classes.gameFooter}>
                <div className={classes.gameTeams}>
                    <PeopleAltRounded fontSize={'medium'} />
                    <div className={classes.gameTeamsCount}>{teamsCount}</div>
                </div>
                {props.role === Roles.user &&
                props.accessLevel === AccessLevel.PUBLIC &&
                props.status !== Status.Started ? (
                    <SignUpToGameItem
                        isAddToGame={amIParticipate}
                        userTeam={props.userTeam}
                        handleAdd={handleAddToGame}
                        handleOut={handleOutOfGame}
                    />
                ) : null}
            </div>
            <GameStatus status={props.status} />

            {props.role === Roles.admin ? (
                <div className={classes.gameActions}>
                    {props.status === Status.NotStarted ? (
                        <IconButton
                            onClick={handleEditClick}
                            edge={'end'}
                            sx={{
                                '& .MuiSvgIcon-root': {
                                    color: 'var(--color-text-icon-link-enabled)',
                                    fontSize: 'var(--font-size-24)',
                                },
                            }}
                        >
                            <EditRounded />
                        </IconButton>
                    ) : null}
                    <IconButton
                        onClick={handleDeleteClick}
                        edge={'end'}
                        sx={{
                            '& .MuiSvgIcon-root': {
                                color: 'var(--color-text-icon-error)',
                                fontSize: 'var(--font-size-24)',
                            },
                        }}
                    >
                        <DeleteRounded />
                    </IconButton>
                </div>
            ) : null}
        </div>
    );
}

export default GameItem;
