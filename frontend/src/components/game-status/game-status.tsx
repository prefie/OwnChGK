import classes from "./game-status.module.scss";

interface GameStatusProps {
    status: string;
}


function GameStatus(props: GameStatusProps) {
    let statusCaption = '';
    if (props.status === 'not_started') {
        return (
            <div className={classes.statusWrapperNotStarted}>
                <p className={classes.statusStateNotStarted}>Ещё не началась</p>
            </div>
        );
    } else if (props.status === 'started') {
        return (
            <div className={classes.statusWrapperStarted}>
                <p className={classes.statusStateStarted}>Сейчас идёт</p>
            </div>
        );
    } else if (props.status == 'finished') {
        return (
            <div className={classes.statusWrapperFinished}>
                <p className={classes.statusStateFinished}>Закончилась</p>
            </div>
        );
    }
    return <></>;
}

export default GameStatus;