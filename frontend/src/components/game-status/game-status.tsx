import classes from './game-status.module.scss';
import { Status } from '../game-item/game-item';

interface GameStatusProps {
    status: Status;
}

function GameStatus(props: GameStatusProps) {
    if (props.status === Status.NotStarted) {
        return (
            <div className={`${classes.statusWrapper} ${classes.statusWrapperNotStarted}`}>
                <p className={`${classes.statusCaption} ${classes.statusCaptionNotStarted}`}>Ещё не начали</p>
            </div>
        );
    } else if (props.status === Status.Started) {
        return (
            <div className={`${classes.statusWrapper} ${classes.statusWrapperStarted}`}>
                <p className={`${classes.statusCaption} ${classes.statusCaptionStarted}`}>Сейчас идёт</p>
            </div>
        );
    } else if (props.status == Status.Finished) {
        return (
            <div className={`${classes.statusWrapper} ${classes.statusWrapperFinished}`}>
                <p className={`${classes.statusCaption} ${classes.statusCaptionFinished}`}>Завершена</p>
            </div>
        );
    }
    return <></>;
}

export default GameStatus;