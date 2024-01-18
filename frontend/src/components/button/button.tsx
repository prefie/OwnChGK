import { CustomButtonProps, TypeButton } from '../../entities/custom-button/custom-button.interfaces.ts';
import { Link } from 'react-router-dom';
import classes from './button.module.scss';

function Button(props: CustomButtonProps): JSX.Element {
    const content = (
        <>
            {props.hasLeftIcon && props.icon}
            {props.content && props.content}
            {props.hasRightIcon && props.icon}
        </>
    );
    if (props.type === TypeButton.Link && props.to) {
        return (
            <Link className={props.className} to={props.to}>
                {content}
            </Link>
        );
    }
    return (
        <button
            className={`${props.active ? classes.button_active : ''} ${props.className}`}
            onClick={props.onClick}
            disabled={props.disabled}
        >
            {content}
        </button>
    );
}

export default Button;
