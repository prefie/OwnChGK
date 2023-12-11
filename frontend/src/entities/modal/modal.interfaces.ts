import {Dispatch, SetStateAction} from 'react';
import {Game, Team} from '../../pages/admin-start-screen/admin-start-screen';
import {GamePartSettings} from "../../server-api/type";

export interface ModalProps {
    modalType: 'delete' | 'break' | 'delete-game-part';
    closeModal: Dispatch<SetStateAction<boolean>>;
    setGamePartUndefined?: Dispatch<SetStateAction<GamePartSettings | undefined>>;
    deleteGame?: Dispatch<SetStateAction<Game[] | undefined>>;
    deleteTeam?: Dispatch<SetStateAction<Team[] | undefined>>;
    itemForDeleteName?: string;
    itemForDeleteId?: string;
    type?: 'team' | 'game';
    gameId?: string | undefined;
    startBreak?: Dispatch<SetStateAction<boolean>>;
    setBreakTime?: Dispatch<SetStateAction<number>>;
}