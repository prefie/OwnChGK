import React, { FC } from 'react';
import { CustomButtonProps, TypeButton } from '../../entities/custom-button/custom-button.interfaces.ts';

const Button: FC<CustomButtonProps> = props => {
    const content = (
        <>
            {props.hasLeftIcon && props.leftIcon}
            {props.content && props.content}
            {props.hasRightIcon && props.rightIcon}
        </>
    );
    if (props.type === TypeButton.Link && props.ref) {
        return (
            <a className={props.className} onClick={props.onClick} href={props.ref}>
                {content}
            </a>
        );
    }
    return (
        <button className={props.className} onClick={props.onClick}>
            {content}
        </button>
    );
};

export default Button;
