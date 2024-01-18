import React from 'react';
import { Team } from '../../pages/admin-start-screen/admin-start-screen';
import Button from '../button/button.tsx';
import classesButton from '../button/button.module.scss';

interface SignUpToGameItemProps {
    isAddToGame: boolean;
    userTeam: Team | undefined;
    handleAdd?: React.MouseEventHandler;
    handleOut?: React.MouseEventHandler;
}

function SignUpToGameItem(props: SignUpToGameItemProps) {
    if (props.userTeam && props.userTeam.name !== '') {
        return props.isAddToGame ? (
            <Button
                className={`${classesButton.button} ${classesButton.button_link}`}
                content={'Выйти из игры'}
                onClick={props.handleOut}
            />
        ) : (
            <Button
                className={`${classesButton.button} ${classesButton.button_link}`}
                content={'Вступить в игру'}
                onClick={props.handleAdd}
            />
        );
    } else {
        return (
            <Button
                className={`${classesButton.button} ${classesButton.button_link} ${classesButton.button_link_disabled}`}
                content={'Вступить в игру'}
                onClick={props.handleAdd}
            />
        );
    }
}

export default SignUpToGameItem;
