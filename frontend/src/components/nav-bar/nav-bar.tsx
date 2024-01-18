import React, { FC, Fragment, useEffect, useCallback } from 'react';
import classes from './nav-bar.module.scss';
import { Link } from 'react-router-dom';
import { NavBarProps } from '../../entities/nav-bar/nav-bar.interfaces';

const NavBar: FC<NavBarProps> = props => {
    const handleIndicator = (e: React.SyntheticEvent) => {
        const items = document.querySelectorAll(`.${classes['nav-item']}`);
        const el = e.target as HTMLElement;

        items.forEach(function (item) {
            item.classList.remove(classes['is-active']);
            item.removeAttribute('style');
        });

        el.classList.add(classes['is-active']);
        handleLinkChange(e);
    };

    const handleLinkChange = useCallback(
        e => {
            props.onLinkChange?.((e.target as HTMLElement).id);
        },
        [props],
    );

    return (
        <nav className={`${classes.nav}`}>
            {props.isAdmin ? (
                <Fragment>
                    <Link
                        to={{ pathname: '/admin/start-screen', state: { page: 'games' } }}
                        id="games"
                        className={`${classes['nav-item']} ${props.page === 'games' ? classes['is-active'] : null}`}
                        onClick={handleIndicator}
                    >
                        Игры
                    </Link>
                    <Link
                        to={{ pathname: '/admin/start-screen', state: { page: 'teams' } }}
                        id="teams"
                        className={`${classes['nav-item']} ${props.page === 'teams' ? classes['is-active'] : null}`}
                        onClick={handleIndicator}
                    >
                        Команды
                    </Link>
                    <Link
                        to={{ pathname: '/admin/start-screen', state: { page: 'admins' } }}
                        id="admins"
                        className={`${classes['nav-item']} ${props.page === 'admins' ? classes['is-active'] : null}`}
                        onClick={handleIndicator}
                    >
                        Админы
                    </Link>
                </Fragment>
            ) : (
                <Fragment>
                    <Link
                        to={{ pathname: '/start-screen', state: { page: 'teams' } }}
                        id="teams"
                        className={`${classes['nav-item']} ${props.page === 'teams' ? classes['is-active'] : null}`}
                        onClick={handleIndicator}
                    >
                        Команды
                    </Link>
                    <Link
                        to={{ pathname: '/start-screen', state: { page: 'games' } }}
                        id="games"
                        className={`${classes['nav-item']} ${props.page === 'games' ? classes['is-active'] : null}`}
                        onClick={handleIndicator}
                    >
                        Игры
                    </Link>
                </Fragment>
            )}
        </nav>
    );
};

export default NavBar;
