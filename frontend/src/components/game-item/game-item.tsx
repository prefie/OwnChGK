import {DeleteRounded, EditRounded, PeopleAltRounded} from "@mui/icons-material";
import {GameTypeItemProps} from "../game-type-item/game-type-item";
import classes from './game-item.module.scss';
import GameTypeList from "../game-type-list/game-type-list";
import {IconButton} from "@mui/material";
import React, {Dispatch, SetStateAction, useCallback, useEffect, useState} from "react";
import {Redirect} from "react-router-dom";
import {Link} from 'react-router-dom';

export enum Roles {
    user,
    admin,
    superAdmin
}

interface GameItemProps {
    id: string;
    name: string;
    teamsCount: number;
    status: string,
    games: GameTypeItemProps[];
    openModal?: Dispatch<SetStateAction<boolean>>;
    setItemForDeleteName?: Dispatch<SetStateAction<string>>;
    setItemForDeleteId?: Dispatch<SetStateAction<string>>;
    role: Roles
}

function GameItem(props: GameItemProps) {
    const [isRedirectedToEdit, setIsRedirectedToEdit] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const gameId = props.id;

    useEffect(() => {
        function goToGame(event: MouseEvent) {
            const clickedElement = event.target as HTMLElement;
            if (clickedElement.id === props.id) {
                setIsClicked(true);
            }
        }

        window.addEventListener('click', goToGame, true);

        return () => {
            window.removeEventListener('click', goToGame, true);
        };
    });

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

    if (isClicked) {
        return <Redirect to={`/admin/start-game/${props.id}`}/>;
    }
    return isRedirectedToEdit
        ? <Redirect to={{pathname: '/admin/game-creation/edit', state: {id: props.id, name: props.name}}}/>
        : (
            <div className={classes.gameContent} id={gameId}>
                <Link to={`/admin/start-game/${props.id}`} className={classes.gameTitle}>{props.name}</Link>
                <GameTypeList types={props.games}/>
                <div className={classes.gameFooter}>
                    <div className={classes.gameTeams}>
                        <PeopleAltRounded fontSize={"medium"}/>
                        <div className="game-commands-count">{props.teamsCount}</div>
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
            </div>
        );
}

export default GameItem;