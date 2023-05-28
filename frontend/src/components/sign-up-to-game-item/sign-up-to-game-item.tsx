import classes from './sign-up-to-game-item.module.scss'
import React from "react";

interface SignUpToGameItemProps {
    isAddToGame: boolean;
    handleAdd?: React.MouseEventHandler;
    handleOut?: React.MouseEventHandler;
}

function SignUpToGameItem(props: SignUpToGameItemProps) {
    return (
        props.isAddToGame
            ?
            <div className={classes.signUpLinkSuccess}>
                Вы в игре
                <p className={classes.signOutLink} onClick={props.handleOut}>Отменить</p>
            </div>
            :
            <div className={classes.signUpLink} onClick={props.handleAdd}>
                Записаться на игру
            </div>
    );
}

export default SignUpToGameItem;