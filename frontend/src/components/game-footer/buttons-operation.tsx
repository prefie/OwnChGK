import { DeleteRounded, EditRounded, DownloadRounded, ExitToApp } from '@mui/icons-material';
import classes from '../game-item/game-item.module.scss';
import { Dispatch, SetStateAction, useCallback } from 'react';
import { OperationName } from '../modal/modal.tsx';
import Button from '../button/button.tsx';
import classesButton from '../button/button.module.scss';
import { Roles, Status as StatusGame } from '../game-item/game-item.tsx';

export enum Status {
    NotStarted = 'not_started',
    Started = 'started',
    Finished = 'finished',
}

interface GameItemButtonProps {
    name: string;
    id: string;
    status: StatusGame;
    setIsRedirectedToEdit: Dispatch<SetStateAction<boolean>>;
    setIsRedirectedToDownload: Dispatch<SetStateAction<boolean>>;
    openModal?: Dispatch<SetStateAction<boolean>>;
    setItemName?: Dispatch<SetStateAction<string>>;
    setItemId?: Dispatch<SetStateAction<string>>;
    setOperationName?: Dispatch<SetStateAction<OperationName | null>>;
    role: Roles;
}

function GameItemButtons(props: GameItemButtonProps) {
    const handleDeleteClick = (event: Event) => {
        event.preventDefault();
        setItemName();
        if (props.setOperationName) {
            props.setOperationName(OperationName.Deletion);
        }
        handleOpenModal();
    };

    const handleFinishedClick = (event: Event) => {
        event.preventDefault();
        setItemName();
        if (props.setOperationName) {
            props.setOperationName(OperationName.Ending);
        }
        handleOpenModal();
    };

    const handleEditClick = (event: Event) => {
        event.preventDefault();
        props.setIsRedirectedToEdit(true);
    };

    const handleDownloadClick = (event: Event) => {
        event.preventDefault();
        props.setIsRedirectedToDownload(true);
    };

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

    if (props.role === Roles.user) {
        if (props.status === Status.Finished) {
            return (
                <div className={classes.gameActions}>
                    <Button
                        className={`${classesButton.button} ${classesButton.button_red} ${classesButton.button_link}`}
                        onClick={handleDownloadClick}
                        hasLeftIcon
                        icon={
                            <DownloadRounded
                                style={{
                                    color: 'var(--color-text-icon-link-primary)',
                                    fontSize: 'var(--font-size-20)',
                                }}
                            />
                        }
                    />
                </div>
            );
        } else {
            return null;
        }
    }

    if (props.status === Status.NotStarted) {
        return (
            <div className={classes.gameActions}>
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
            </div>
        );
    }

    if (props.status === Status.Started) {
        return (
            <div className={classes.gameActions}>
                <Button
                    className={`${classesButton.button} ${classesButton.button_red} ${classesButton.button_link}`}
                    onClick={handleFinishedClick}
                    hasLeftIcon
                    icon={<ExitToApp style={{ color: 'var(--color-strokes-error)', fontSize: 'var(--font-size-20)' }} />}
                />
            </div>
        );
    }

    if (props.status === Status.Finished) {
        return (
            <div className={classes.gameActions}>
                <Button
                    className={`${classesButton.button} ${classesButton.button_red} ${classesButton.button_link}`}
                    onClick={handleDownloadClick}
                    hasLeftIcon
                    icon={
                        <DownloadRounded
                            style={{
                                color: 'var(--color-text-icon-link-primary)',
                                fontSize: 'var(--font-size-20)',
                            }}
                        />
                    }
                />
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
            </div>
        );
    }

    return null;
}

export default GameItemButtons;
