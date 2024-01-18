import { Redirect } from 'react-router-dom';
import classes from '../team-item/team-item.module.scss';
import { PersonAddAltRounded, PersonRounded } from '@mui/icons-material';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { Roles } from '../game-item/game-item';
import { Team } from '../../pages/admin-start-screen/admin-start-screen';
import classNames from 'classnames';
import TeamItemFooter from '../team-footer/footer.tsx';

export interface Participant {
    email: string;
    name: string;
}

interface TeamItemProps {
    id: string;
    name: string;
    captainId: string;
    captainEmail: string;
    participants: Participant[];
    participantsCount: number;
    role: Roles;
    userTeam?: Team;
    openModal?: Dispatch<SetStateAction<boolean>>;
    setItemName?: Dispatch<SetStateAction<string>>;
    setItemId?: Dispatch<SetStateAction<string>>;
    onClick?: React.MouseEventHandler;
}

function TeamItem(props: TeamItemProps) {
    const [isRedirectedToEdit, setIsRedirectedToEdit] = useState(false);
    /*const [isClicked, setIsClicked] = useState(false);
    const [isClickedOnCurrentTeam, setIsClickedOnCurrentTeam] = useState<boolean>(false);
    */
    const linkToTeam = props.role === Roles.user ? `/team-creation/edit` : `/admin/team-creation/edit`;

    function CaptainBlock() {
        if (props.captainId) {
            return (
                <div className={classes.captain}>
                    <PersonRounded fontSize={'20px'} />
                    <p className={classes.captainName}>{props.captainEmail}</p>
                </div>
            );
        } else {
            if (props.role === Roles.user) {
                return (
                    <div className={classNames(classes.captain, classes.captainLink)} onClick={props.onClick}>
                        <PersonAddAltRounded fontSize={'20px'} />
                        <p className={classes.captainName}>Стать капитаном</p>
                    </div>
                );
            } else {
                return (
                    <div className={classNames(classes.captain, classes.captainNull)}>
                        <PersonRounded fontSize={'20px'} />
                        <p className={classes.captainName}>Нет капитана</p>
                    </div>
                );
            }
        }
    }

    if (isRedirectedToEdit) {
        return <Redirect to={{ pathname: linkToTeam, state: { id: props.id, name: props.name } }} />;
    }

    return (
        <div className={classes.teamContent}>
            <div className={classes.teamTitle}>{props.name}</div>
            <div className={classes.teamInfo}>
                <CaptainBlock />
                <TeamItemFooter {...props} setIsRedirectedToEdit={setIsRedirectedToEdit} />
            </div>
        </div>
    );
}

export default TeamItem;
