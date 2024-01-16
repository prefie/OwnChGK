import GameTypeItem, { GameTypeItemProps } from '../game-type-item/game-type-item';
import classes from './game-type-list.module.scss';

interface GameTypeListProps {
    types: GameTypeItemProps[];
}

function GameTypeList(props: GameTypeListProps) {
    const { types } = props;
    return (
        <table className={classes.gameTypesList}>
            <tr>
                {types.map(type => (
                    <GameTypeItem type={type.type} questionsCount={type.questionsCount} roundsCount={type.roundsCount} />
                ))}
            </tr>
        </table>
    );
}

export default GameTypeList;
