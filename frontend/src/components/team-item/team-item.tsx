import {Link, Redirect} from "react-router-dom";
import classes from "../team-item/team-item.module.scss";
import {DeleteRounded, EditRounded, PeopleAltRounded, PersonRounded} from "@mui/icons-material";
import {IconButton} from "@mui/material";
import React, {Dispatch, SetStateAction, useCallback, useState} from "react";
import {Roles} from "../game-item/game-item";

export interface Participant {
    email: string;
    name: string;
}

interface TeamItemProps {
    id: string;
    name: string;
    captainId: string;
    captainEmail: string;
    participants: Participant[];
    participantsCount: number;
    role: Roles;
    openModal?: Dispatch<SetStateAction<boolean>>;
    setItemForDeleteName?: Dispatch<SetStateAction<string>>;
    setItemForDeleteId?: Dispatch<SetStateAction<string>>;
}

function TeamItem(props: TeamItemProps) {
    const [isRedirectedToEdit, setIsRedirectedToEdit] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const linkToTeam = props.role === Roles.user
        ? `/team-creation/edit`
        : `/admin/team-creation/edit`

    function getCorrectDeclensionConnoisseur(count: number) {
        if (count >= 5) {
            return `${count} знатоков`;
        } else if (count >= 2 && count <= 4) {
            return `${count} знатока`;
        } else if (count === 1) {
            return `${count} знаток`;
        } else {
            return `Нет знатоков`;
        }

    }

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

    const handleDeleteClick = (event: React.SyntheticEvent) => {
        setItemName(event);
        handleOpenModal(event);
    };

    const handleEditClick = (event: React.SyntheticEvent) => {
        setIsRedirectedToEdit(true);
    };

    return isRedirectedToEdit
        ? <Redirect to={{pathname: '/admin/team-creation/edit', state: {id: props.id, name: props.name}}}/>
        : (
            <div className={classes.teamContent}>
                <Link to={"#"} className={classes.teamTitle}>{props.name}</Link>
                {
                    props.captainId
                        ?
                        <div className={classes.captain}>
                            <PersonRounded fontSize={"medium"}/>
                            <p className={classes.captainName}>{props.captainEmail}</p>
                        </div>
                        :
                        <div className={classes.captainNull}>
                            <PersonRounded fontSize={"medium"}/>
                            <p className={classes.captainName}>Нет капитана</p>
                        </div>
                }
                <div className={classes.teamFooter}>
                    <div className={classes.teamsParticipants}>
                        <PeopleAltRounded fontSize={"medium"}/>
                        <div className={classes.participantsCount}>
                            {getCorrectDeclensionConnoisseur(props.participantsCount)}
                        </div>
                    </div>
                </div>
                {
                    props.role === Roles.admin
                        ?
                        <div className={classes.teamActions}>
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

export default TeamItem;