import {DeleteRounded, EditRounded, PeopleAltRounded} from "@mui/icons-material";
import {GameTypeItemProps} from "../game-type-item/game-type-item";
import classes from './game-item.module.scss';
import GameTypeList from "../game-type-list/game-type-list";
import {IconButton} from "@mui/material";
import React, {Dispatch, SetStateAction, useCallback, useState} from "react";
import {Redirect} from "react-router-dom";
import {Link} from 'react-router-dom';
import SignUpToGameItem from "../sign-up-to-game-item/sign-up-to-game-item";
import {addCurrentTeamInGame, deleteCurrentTeamFromGame} from "../../server-api/server-api";

export enum Roles {
    user,
    admin,
    superAdmin
}

export enum AccessLevel {
    PUBLIC = 'public',
    PRIVATE = 'private'
}

interface GameItemProps {
    id: string;
    name: string;
    teamsCount: number;
    status: string,
    games: GameTypeItemProps[];
    accessLevel: AccessLevel;
    openModal?: Dispatch<SetStateAction<boolean>>;
    setItemForDeleteName?: Dispatch<SetStateAction<string>>;
    setItemForDeleteId?: Dispatch<SetStateAction<string>>;
    role: Roles;
    onClick?: React.MouseEventHandler
}

function GameItem(props: GameItemProps) {
    const [isRedirectedToEdit, setIsRedirectedToEdit] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [isAddToGame, setIsAddToGame] = useState(false);
    const gameId = props.id;
    const linkToGame = props.role === Roles.user
        ? `/game/${props.id}`
        : `/admin/start-game/${props.id}`

    const handleDeleteClick = (event: React.SyntheticEvent) => {
        setItemName(event);
        handleOpenModal(event);
    };

    const setItemName = useCallback(e => {
        if (props.setItemForDeleteName) {
            props.setItemForDeleteName(props.name);
        }
        if (props.setItemForDeleteId) {
            props.setItemForDeleteId(props.id as string);
        }
    }, [props]);

    const handleOpenModal = useCallback(e => {
        if (props.openModal) {
            props.openModal(true);
        }
    }, [props]);

    const handleEditClick = (event: React.SyntheticEvent) => {
        setIsRedirectedToEdit(true);
    };

    function handleAddToGame() {
        addCurrentTeamInGame(props.id).then(res => {
            if (res.status === 200) {
                setIsAddToGame(true);
            }
        });
    }

    function handleOutOfGame() {
        deleteCurrentTeamFromGame(props.id).then(res => {
            if (res.status === 200) {
                setIsAddToGame(false);
            }
        })
    }

    return isRedirectedToEdit
        ? <Redirect to={{pathname: '/admin/game-creation/edit', state: {id: props.id, name: props.name}}}/>
        : (
            <div className={classes.gameContent} onClick={props.onClick}>
                <Link to={linkToGame} className={classes.gameTitle} id={gameId}>{props.name}</Link>
                <GameTypeList types={props.games}/>
                <div className={classes.gameFooter} id={gameId}>
                    <div className={classes.gameTeams}>
                        <PeopleAltRounded fontSize={"medium"}/>
                        <div className={classes.gameTeamsCount}>{props.teamsCount}</div>
                    </div>
                    {
                        props.role === Roles.user && props.accessLevel === AccessLevel.PUBLIC
                            ?
                            <SignUpToGameItem
                                isAddToGame={isAddToGame}
                                handleAdd={handleAddToGame}
                                handleOut={handleOutOfGame}
                            />
                            : null
                    }
                </div>
                {
                    props.role === Roles.admin
                        ?
                        <div className={classes.gameActions}>
                            <IconButton
                                onClick={handleEditClick}
                                edge={'end'}
                                sx={{
                                    '& .MuiSvgIcon-root': {
                                        color: 'var(--color-text-icon-link-enabled)',
                                        fontSize: 'var(--font-size-24)'
                                    }
                                }}
                            >
                                <EditRounded/>
                            </IconButton>
                            <IconButton
                                onClick={handleDeleteClick}
                                edge={'end'}
                                sx={{
                                    '& .MuiSvgIcon-root': {
                                        color: 'var(--color-text-icon-error)',
                                        fontSize: 'var(--font-size-24)'
                                    }
                                }}
                            >
                                <DeleteRounded/>
                            </IconButton>
                        </div>
                        :
                        null
                }
            </div>
        );
}

export default GameItem;