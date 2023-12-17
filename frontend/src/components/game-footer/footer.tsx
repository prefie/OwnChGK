import classes from '../game-item/game-item.module.scss';
import { Dispatch, SetStateAction } from 'react';
import { OperationName } from '../modal/modal.tsx';
import GameStatus from '../game-status/game-status.tsx';
import GameItemButtons from './buttons-operation.tsx';
import { Roles, Status } from '../game-item/game-item.tsx';

interface GameItemFooterProps {
    name: string;
    id: string;
    status: Status;
    setIsRedirectedToEdit: Dispatch<SetStateAction<boolean>>;
    setIsRedirectedToDownload: Dispatch<SetStateAction<boolean>>;
    openModal?: Dispatch<SetStateAction<boolean>>;
    setItemName?: Dispatch<SetStateAction<string>>;
    setItemId?: Dispatch<SetStateAction<string>>;
    setOperationName?: Dispatch<SetStateAction<OperationName | null>>;
    role: Roles;
}

function GameItemFooter(props: GameItemFooterProps) {
    return (
        <div className={classes.gameFooter}>
            <GameStatus status={props.status} />

            {props.role === Roles.admin && <GameItemButtons {...props} />}
        </div>
    );
}

export default GameItemFooter;
