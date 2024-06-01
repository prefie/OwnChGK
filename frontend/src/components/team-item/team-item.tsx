import { Redirect } from 'react-router-dom';
import classes from '../team-item/team-item.module.scss';
import { DeleteRounded, EditRounded, PeopleAltRounded, PersonAddAltRounded, PersonRounded } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Roles } from '../game-item/game-item';
import { Team } from '../../pages/admin-start-screen/admin-start-screen';

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
    userTeam?: Team;
    openModal?: Dispatch<SetStateAction<boolean>>;
    setItemForDeleteName?: Dispatch<SetStateAction<string>>;
    setItemForDeleteId?: Dispatch<SetStateAction<string>>;
    onClick?: React.MouseEventHandler;
}

function TeamItem(props: TeamItemProps) {
    const [isRedirectedToEdit, setIsRedirectedToEdit] = useState(false);
    const linkToTeam = props.role === Roles.user ? `/team-creation/edit` : `/admin/team-creation/edit`;

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

    function CaptainBlock() {
        if (props.captainId) {
            return (
                <div className={classes.captain}>
                    <PersonRounded fontSize={'medium'} />
                    <p className={classes.captainName}>{props.captainEmail}</p>
                </div>
            );
        } else {
            if (props.role === Roles.user) {
                return (
                    <div
                        className={classes.captainLink}
                        onClick={props.onClick}
                    >
                        <PersonAddAltRounded fontSize={'medium'} />
                        <p className={classes.captainName}>Стать капитаном</p>
                    </div>
                );
            } else {
                return (
                    <div className={classes.captainNull}>
                        <PersonRounded fontSize={'medium'} />
                        <p className={classes.captainName}>Нет капитана</p>
                    </div>
                );
            }
        }
    }

    function ParticipantsBlock() {
        const participantsCount = props.captainId ? props.participantsCount + 1 : props.participantsCount;

        if (participantsCount === 0) {
            return (
                <div className={`${classes.teamsParticipants} ${classes.teamsParticipantsEmpty}`}>
                    <PeopleAltRounded fontSize={'medium'} />
                    <div className={classes.participantsCount}>Нет знатоков</div>
                </div>
            );
        } else {
            return (
                <div className={classes.teamsParticipants}>
                    <PeopleAltRounded fontSize={'medium'} />
                    <div className={classes.participantsCount}>
                        {getCorrectDeclensionConnoisseur(participantsCount)}
                    </div>
                </div>
            );
        }
    }

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

    const handleDeleteClick = () => {
        setItemName();
        handleOpenModal();
    };

    const handleEditClick = () => {
        setIsRedirectedToEdit(true);
    };

    if (isRedirectedToEdit) {
        return <Redirect to={{ pathname: linkToTeam, state: { id: props.id, name: props.name } }} />;
    } else {
        return (
            <div className={classes.teamContent}>
                <div className={classes.teamTitle}>{props.name}</div>
                <CaptainBlock />
                <div className={classes.teamFooter}>
                    <ParticipantsBlock />
                </div>
                <div className={classes.teamActions}>
                    {!props.userTeam || props.userTeam.name ? (
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
                    {props.role === Roles.admin ? (
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
                    ) : null}
                </div>
            </div>
        );
    }
}

export default TeamItem;
