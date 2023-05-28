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
                <p className={classes.signOutLink} onClick={props.handleOut}>Выйти из игры</p>
            </div>
            :
            <p className={classes.signUpLink} onClick={props.handleAdd}>Вступить в игру</p>
    );
}

export default SignUpToGameItem;