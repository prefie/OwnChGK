import {PeopleAltRounded} from "@mui/icons-material";

interface GameItemProps {
    id: string;
    name: string;
    teamsCount: number;
}

function GameItem(props: GameItemProps) {


    return (
        <div className="game-content">
            <h2 className="game-title">{props.name}</h2>
            <div className="game-types-list">
                <div className="game-type">
                    <div className="game-type-name">ЧГК</div>
                    <div className="game-type-qt">36 ⋅ 3</div>
                </div>
                <div className="game-type">
                    <div className="game-type-name">Матрица</div>
                    <div className="game-type-qt">25 ⋅ 5</div>
                </div>
                <div className="game-type">
                    <div className="game-type-name">Квиз</div>
                    <div className="game-type-qt">25 ⋅ 5</div>
                </div>
            </div>
            <div className="game-teams">
                <PeopleAltRounded/>
                <div className="game-commands-count">{props.teamsCount}</div>
            </div>
        </div>
    );
}

export default GameItem;