import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React, { FC, useCallback, useState } from 'react';
import classes from './modal.module.scss';
import classesButton from '../button/button.module.scss';
import { ModalProps } from '../../entities/modal/modal.interfaces';
import { ServerApi } from '../../server-api/server-api';
import { getCookie, getUrlForSocket } from '../../commonFunctions';
import { createPortal } from 'react-dom';
import Button from '../button/button.tsx';
import { useHistory } from 'react-router-dom';
import { Status } from '../game-item/game-item.tsx';

let conn: WebSocket;

export enum OperationName {
    Deletion = 'deletion',
    Ending = 'ending',
}

const Modal: FC<ModalProps> = props => {
    const [minutes, setMinutes] = useState<number>(0);
    const history = useHistory();
    const handleMinutesCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (+event.target.value <= 99) {
            setMinutes(+event.target.value);
        }
    };

    const handleCloseModal = useCallback(() => {
        props.closeModal(false);
    }, [props]);

    const handleCloseModalClick = () => {
        handleCloseModal();
    };

    const handleDelete = useCallback(() => {
        if (props.modalType === 'delete-game-part') {
            props.setGamePartUndefined?.(undefined);
        } else {
            if (props.type === 'game') {
                props.deleteGame?.(arr => arr?.filter(el => el.name !== props.itemName));
                ServerApi.deleteGame(props.itemId as string);
            } else {
                props.deleteTeam?.(arr => arr?.filter(el => el.name !== props.itemName));
                ServerApi.deleteTeam(props.itemId as string);
            }
        }
    }, [props]);

    const handleFinished = useCallback(() => {
        try {
            ServerApi.endGame(props.itemId as string)
                .then(
                    () =>
                        props.deleteGame?.(
                            arr => arr?.map(game => (game.id !== props.itemId ? game : { ...game, status: Status.Finished })),
                        ),
                )
                .then(() => history.push('/admin/start-screen'))
                .then(() => handleCloseModal());
        } catch (e) {}
    }, [props]);

    const handleDeleteClick = () => {
        handleDelete();
        handleCloseModal();
    };

    const handleFinishedClick = () => {
        handleFinished();
    };

    const handleStartBreak = () => {
        if (minutes !== 0) {
            props.setBreakTime?.(minutes * 60);
            props.startBreak?.(true);
            conn = new WebSocket(getUrlForSocket());
            conn.onopen = () => {
                conn.send(
                    JSON.stringify({
                        cookie: getCookie('authorization'),
                        gameId: props.gameId,
                        action: 'breakTime',
                        time: minutes * 60,
                    }),
                );
            };
        }
        handleCloseModal();
    };

    const modalContent = (
        <div className={classes.modalBody}>
            {(() => {
                switch (props.operationName) {
                    case OperationName.Ending:
                        return (
                            <>
                                <p className={classes.modalText}>Вы уверены, что хотите завершить игру «{props.itemName}»?</p>
                                <div className={classes.modalButtons}>
                                    <Button
                                        className={`${classesButton.button} ${classesButton.button_primary}`}
                                        onClick={handleFinishedClick}
                                        content={'Завершить'}
                                    />
                                    <Button
                                        className={`${classesButton.button}`}
                                        onClick={handleCloseModal}
                                        content={'Отменить'}
                                    />
                                </div>
                            </>
                        );
                    default:
                        return (
                            <>
                                {props.modalType === 'delete' ? (
                                    <p className={classes.modalText}>Вы уверены, что хотите удалить «{props.itemName}»?</p>
                                ) : props.modalType === 'delete-game-part' ? (
                                    <p className={classes.modalText}>Вы уверены, что хотите удалить {props.itemName}?</p>
                                ) : (
                                    <p className={`${classes.modalText} ${classes.breakModalText}`}>
                                        Перерыв
                                        <input
                                            className={classes.minutesInput}
                                            type="text"
                                            id="minutes"
                                            name="minutes"
                                            value={minutes || ''}
                                            required={true}
                                            onChange={handleMinutesCountChange}
                                        />
                                        минут
                                    </p>
                                )}
                                <div className={classes.modalButtonWrapper}>
                                    <button
                                        className={classes.modalButton}
                                        onClick={
                                            props.modalType === 'delete' || props.modalType === 'delete-game-part'
                                                ? handleDeleteClick
                                                : handleStartBreak
                                        }
                                    >
                                        {props.modalType === 'delete' || props.modalType === 'delete-game-part'
                                            ? 'Да'
                                            : 'Запустить'}
                                    </button>
                                </div>
                            </>
                        );
                }
            })()}
        </div>
    );

    return createPortal(
        <>
            <div className={classes.modal}>
                <div className={classes.closeButtonWrapper}>
                    <IconButton onClick={handleCloseModalClick}>
                        <CloseIcon
                            sx={{
                                color: 'white',
                                fontSize: '32px',
                            }}
                        />
                    </IconButton>
                </div>
                {modalContent}
            </div>
            <div className={classes.overlay} />
        </>,
        document.getElementById('root') as HTMLElement,
    );
};
export default Modal;
