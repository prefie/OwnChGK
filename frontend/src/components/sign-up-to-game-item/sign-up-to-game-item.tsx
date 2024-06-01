import classes from './sign-up-to-game-item.module.scss';
import React from 'react';
import { Team } from '../../pages/admin-start-screen/admin-start-screen';

interface SignUpToGameItemProps {
    isAddToGame: boolean;
    userTeam: Team | undefined;
    handleAdd?: React.MouseEventHandler;
    handleOut?: React.MouseEventHandler;
}

function SignUpToGameItem(props: SignUpToGameItemProps) {
    if (props.userTeam && props.userTeam.name !== '') {
        return props.isAddToGame ? (
            <div className={classes.signUpLinkSuccess}>
                <p
                    className={classes.signOutLink}
                    onClick={props.handleOut}
                >
                    Выйти из игры
                </p>
            </div>
        ) : (
            <p
                className={classes.signUpLink}
                onClick={props.handleAdd}
            >
                Вступить в игру
            </p>
        );
    } else {
        return <p className={`${classes.signUpLink} ${classes.signUpLinkDisabled}`}>Вступить в игру</p>;
    }
}

export default SignUpToGameItem;
