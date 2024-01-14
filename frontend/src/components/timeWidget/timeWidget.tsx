import classes from './timeWidget.module.scss';

interface TimeWidgetProps {
    time: string;
    isBreak: boolean;
}

function TimeWidget(props: TimeWidgetProps) {
    return (
        <div className={classes.contentWrapper}>
            <h1 className={classes.time}>{props.time}</h1>
            {props.isBreak ? <p className={classes.caption}>Идёт перерыв</p> : null}
        </div>
    );
}

export default TimeWidget;
