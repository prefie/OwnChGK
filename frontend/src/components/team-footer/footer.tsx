import React, { Dispatch, SetStateAction } from 'react';
import { Roles } from '../game-item/game-item.tsx';
import { PeopleAltRounded } from '@mui/icons-material';
import classes from '../team-item/team-item.module.scss';
import { Team } from '../../pages/admin-start-screen/admin-start-screen.tsx';
import TeamItemButtons from '../team-footer/buttons-operation.tsx';

interface TeamItemFooterProps {
    id: string;
    name: string;
    captainId: string;
    participantsCount: number;
    role: Roles;
    userTeam?: Team;
    openModal?: Dispatch<SetStateAction<boolean>>;
    setItemName?: Dispatch<SetStateAction<string>>;
    setItemId?: Dispatch<SetStateAction<string>>;
    onClick?: React.MouseEventHandler;
    setIsRedirectedToEdit: Dispatch<SetStateAction<boolean>>;
}

function TeamItemFooter(props: TeamItemFooterProps) {
    function getCorrectDeclensionConnoisseur(count: number) {
        if (count >= 5) {
            return `${count} знатоков`;
        } else if (count >= 2 && count <= 4) {
            return `${count} знатока`;
        } else if (count === 1) {
            return `${count} знаток`;
        } else {
            return `Нет знатоков`;
        }
    }

    function ParticipantsBlock() {
        const participantsCount = props.captainId ? props.participantsCount + 1 : props.participantsCount;

        if (participantsCount === 0) {
            return (
                <div className={`${classes.teamsParticipants} ${classes.teamsParticipantsEmpty}`}>
                    <PeopleAltRounded fontSize={'20px'} />
                    <div className={classes.participantsCount}>Нет знатоков</div>
                </div>
            );
        } else {
            return (
                <div className={classes.teamsParticipants}>
                    <PeopleAltRounded fontSize={'20px'} />
                    <div className={classes.participantsCount}>{getCorrectDeclensionConnoisseur(participantsCount)}</div>
                </div>
            );
        }
    }

    return (
        <div className={classes.teamFooter}>
            <ParticipantsBlock />

            <TeamItemButtons {...props} />
        </div>
    );
}

export default TeamItemFooter;
