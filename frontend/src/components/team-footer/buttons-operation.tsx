import { DeleteRounded, EditRounded } from '@mui/icons-material';
import classes from '../team-item/team-item.module.scss';
import React, { Dispatch, SetStateAction, useCallback } from 'react';
import Button from '../button/button.tsx';
import classesButton from '../button/button.module.scss';
import { Roles } from '../game-item/game-item.tsx';
import { Team } from '../../pages/admin-start-screen/admin-start-screen.tsx';

export enum Status {
    NotStarted = 'not_started',
    Started = 'started',
    Finished = 'finished',
}

interface TeamItemButtonProps {
    id: string;
    name: string;
    role: Roles;
    userTeam?: Team;
    openModal?: Dispatch<SetStateAction<boolean>>;
    setItemName?: Dispatch<SetStateAction<string>>;
    setItemId?: Dispatch<SetStateAction<string>>;
    onClick?: React.MouseEventHandler;
    setIsRedirectedToEdit: Dispatch<SetStateAction<boolean>>;
}

function GameItemButtons(props: TeamItemButtonProps) {
    const setItemName = useCallback(() => {
        if (props.setItemName) {
            props.setItemName(props.name);
        }
        if (props.setItemId) {
            props.setItemId(props.id as string);
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
        props.setIsRedirectedToEdit(true);
    };

    return (
        <div className={classes.teamActions}>
            {!props.userTeam || props.userTeam.name ? (
                <Button
                    className={`${classesButton.button} ${classesButton.button_red} ${classesButton.button_link}`}
                    onClick={handleEditClick}
                    hasLeftIcon
                    icon={
                        <EditRounded
                            style={{
                                color: 'var(--color-text-icon-link-enabled)',
                                fontSize: 'var(--font-size-20)',
                            }}
                        />
                    }
                />
            ) : null}
            {props.role === Roles.admin ? (
                <Button
                    className={`${classesButton.button} ${classesButton.button_red} ${classesButton.button_link}`}
                    onClick={handleDeleteClick}
                    hasLeftIcon
                    icon={
                        <DeleteRounded
                            style={{
                                color: 'var(--color-text-icon-error)',
                                fontSize: 'var(--font-size-20)',
                            }}
                        />
                    }
                />
            ) : null}
        </div>
    );
}

export default GameItemButtons;
