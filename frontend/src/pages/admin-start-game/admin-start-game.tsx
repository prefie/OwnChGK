import React, {FC, useEffect, useState} from 'react';
import classes from './admin-start-game.module.scss';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import {Redirect, useParams} from 'react-router-dom';
import {ServerApi} from '../../server-api/server-api';
import Header from '../../components/header/header';
import NavBar from '../../components/nav-bar/nav-bar';
import Loader from '../../components/loader/loader';
import {createFileLink} from '../../fileWorker';
import downloadIcon from '../../images/DownloadIcon.svg';
import logoImage from '../../images/Logo.svg';

const StartGame: FC = () => {
    const [gameName, setGameName] = useState<string>();
    const {gameId} = useParams<{ gameId: string }>();
    const [isGameStart, setIsGameStart] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        ServerApi.getGame(gameId).then((res) => {
            if (res.status === 200) {
                res.json().then(({name, isStarted}) => {
                    setGameName(name);
                    setIsGameStart(isStarted);
                    setIsLoading(false);
                });
            }
        });
    }, []);

    const getGameName = () => {
        if ((gameName as string).length > 55) {
            return (gameName as string).slice(0, 55) + '\u2026';
        } else {
            return gameName;
        }
    }

    const handleStart = async () => {
        ServerApi.startGame(gameId).then((res) => {
                if (res.status === 200) {
                    setIsGameStart(true);
                }
            });
    };

    const downloadResults = async (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        ServerApi.getTeamsParticipantTable(gameId).then(res => {
            if (res.status === 200) {
                res.json().then(({participants}) => {
                    createFileLink(participants, `game-${gameId}-participants.csv`);
                });
            }
        })
    }

    if (isLoading) {
        return <Loader />;
    }

    return isGameStart ? <Redirect to={`/admin/game/${gameId}`}/> : (
        <PageWrapper>
            <Header isAuthorized={true} isAdmin={true}>
                <NavBar isAdmin={true} page=""/>
            </Header>

            <div className={classes.contentWrapper}>
                <img className={classes.logo} src={logoImage} alt="logo"/>

                <div className={classes.gameName}>{getGameName()}</div>

                <button className={classes.button} onClick={handleStart}>Запустить игру</button>

                <a className={classes.downloadTeams} onClick={downloadResults}>
                    <img className={classes.downloadIcon} src={downloadIcon} alt='download'/>
                    {'  Скачать список команд'}
                </a>
            </div>
        </PageWrapper>
    );
};

export default StartGame;