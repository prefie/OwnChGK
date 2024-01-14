import { PeopleRounded } from '@mui/icons-material';
import { GameTypeItemProps } from '../game-type-item/game-type-item';
import classes from './game-item.module.scss';
import GameTypeList from '../game-type-list/game-type-list';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { Link } from 'react-router-dom';
import SignUpToGameItem from '../sign-up-to-game-item/sign-up-to-game-item';
import { ServerApi } from "../../server-api/server-api";
import { Team } from '../../pages/admin-start-screen/admin-start-screen';
import { OperationName } from '../modal/modal.tsx';
import GameItemFooter from '../game-footer/footer.tsx';
import { wordFormat } from './utils.ts';

export enum Roles {
    user,
    admin,
    superAdmin
}

export enum AccessLevel {
    PUBLIC = 'public',
    PRIVATE = 'private'
}

export enum Status {
    NotStarted = 'not_started',
    Started = 'started',
    Finished = 'finished'
}

interface GameItemProps {
    id: string;
    name: string;
    teamsCount: number;
    status: Status;
    games: GameTypeItemProps[];
    accessLevel: AccessLevel;
    amIParticipate: boolean;
    userTeam?: Team;
    openModal?: Dispatch<SetStateAction<boolean>>;
    setItemName?: Dispatch<SetStateAction<string>>;
    setItemId?: Dispatch<SetStateAction<string>>;
    setOperationName?: Dispatch<SetStateAction<OperationName | null>>;
    role: Roles;
    onClick?: React.MouseEventHandler;
}

function GameItem(props: GameItemProps) {
    const [isRedirectedToEdit, setIsRedirectedToEdit] = useState(false);
    const [isRedirectedToDownload, setIsRedirectedToDownload] = useState(false);
    const [amIParticipate, setAmIParticipate] = useState(props.amIParticipate);
    const [teamsCount, setTeamsCount] = useState(props.teamsCount);
    const gameId = props.id;
    const linkToGame = props.role === Roles.user
        ? `/game/${props.id}`
        : `/admin/start-game/${props.id}`

    function handleAddToGame() {
        ServerApi.addCurrentTeamInGame(gameId).then(res => {
            if (res.status === 200) {
                setAmIParticipate(true);
                res.json().then(({teamsCount}) => {
                    setTeamsCount(teamsCount);
                });
            } else if (res.status === 403) {
                // добавить обработку
            }
        });
    }

    function handleOutOfGame() {
        ServerApi.deleteCurrentTeamFromGame(gameId).then(res => {
            if (res.status === 200) {
                setAmIParticipate(false);
                res.json().then(({teamsCount}) => {
                    setTeamsCount(teamsCount);
                });
            } else if (res.status === 403) {
                // добавить обработку
            }
        })
    }

    if (isRedirectedToEdit) {
        return <Redirect to={{ pathname: '/admin/game-creation/edit', state: { id: props.id, name: props.name } }} />;
    }

    if (isRedirectedToDownload) {
        return <Redirect to={{ pathname: `/admin/rating/${props.id}` }} />;
    }

    return (
        <Link
            to={linkToGame}
            className={`${classes.gameContent} ${
                (props.role !== Roles.admin && (props.role !== Roles.user || !props.amIParticipate)) ||
                props.status === Status.Finished
                    ? classes.admin
                    : ''
            }`}
        >
            <div className={classes.gameTitle}>{props.name}</div>
            <GameTypeList types={props.games} />
            <div className={classes.gameInfo}>
                <div className={classes.gameTeams}>
                    <PeopleRounded
                        style={{
                            fontSize: 'var(--font-size-20)',
                        }}
                    />
                    <div className={classes.gameTeamsCount}>{`${teamsCount} ${wordFormat(teamsCount)}`}</div>
                </div>
                {props.role === Roles.user && props.accessLevel === AccessLevel.PUBLIC && props.status !== Status.Started ? (
                    <SignUpToGameItem
                        isAddToGame={amIParticipate}
                        userTeam={props.userTeam}
                        handleAdd={handleAddToGame}
                        handleOut={handleOutOfGame}
                    />
                ) : null}
            </div>
            <GameItemFooter
                {...props}
                setIsRedirectedToEdit={setIsRedirectedToEdit}
                setIsRedirectedToDownload={setIsRedirectedToDownload}
            />
        </Link>
    );
}

export default GameItem;
