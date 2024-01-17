import classes from './game-type-item.module.scss';

export interface GameTypeItemProps {
    type: string;
    questionsCount: number;
    roundsCount: number;
}

function getTypeName(type: string) {
    switch (type) {
        case 'chgk':
            return 'ЧГК';
        case 'matrix':
            return 'Матрица';
        case 'quiz':
            return 'Квиз';
        default:
            return '';
    }
}

function GameTypeItem(props: GameTypeItemProps) {
    const { type, questionsCount, roundsCount } = props;

    return (
        <td>
            <div className={classes.gameType}>
                <div className={classes.gameTypeName}>{getTypeName(type)}</div>
                <div className={classes.gameTypeQr}>
                    {roundsCount} по {questionsCount}
                </div>
            </div>
        </td>
    );
}

export default GameTypeItem;
