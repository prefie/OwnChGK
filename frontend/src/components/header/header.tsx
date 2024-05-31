import React, { FC, useEffect, useState } from 'react';
import classes from './header.module.scss';
import { HeaderDispatchProps, HeaderProps, HeaderStateProps } from '../../entities/header/header.interfaces';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { AppState } from '../../entities/app/app.interfaces';
import { Dispatch } from 'redux';
import { AppAction } from '../../redux/reducers/app-reducer/app-reducer.interfaces';
import { logOut } from '../../redux/actions/app-actions/app-actions';
import logoImage from '../../images/Logo.svg';
import { LogoutRounded, PersonRounded, MenuRounded } from '@mui/icons-material';
import { ServerApi } from '../../server-api/server-api';

const Header: FC<HeaderProps> = props => {
    const [mediaMatch, setMediaMatch] = useState<MediaQueryList>(window.matchMedia('(max-width: 600px)'));

    useEffect(() => {
        const resizeEventHandler = () => {
            setMediaMatch(window.matchMedia('(max-width: 600px)'));
        };

        mediaMatch.addEventListener('change', resizeEventHandler);

        return () => {
            mediaMatch.removeEventListener('change', resizeEventHandler);
        };
    }, []);

    const handleLogout = async () => {
        ServerApi.logout().then(() => {});
        props.onLogOut();
    };

    return (
        <header className={classes.Header}>
            <Link to={props.isAdmin ? '/admin/start-screen' : '/start-screen'} className={classes.logoLink}>
                <img className={classes.logo} src={logoImage} alt="logo" />
            </Link>

            <div className={classes.childrenWrapper}>{props.children}</div>

            {props.isAuthorized ? (
                mediaMatch.matches ? (
                    <Link
                        className={classes.MenuLink}
                        to={{ pathname: '/menu', state: { prevPath: window.location.pathname } }}
                    >
                        <MenuRounded
                            style={{
                                color: 'var(--color-text-icon-default-primary)',
                                fontSize: 'var(--font-size-28)',
                            }}
                        />
                    </Link>
                ) : (
                    <div className={classes.userActionsWrapper}>
                        <Link to={props.isAdmin ? '/admin/profile' : '/profile'}>
                            <PersonRounded
                                style={{
                                    color: 'var(--color-text-icon-default-primary)',
                                    fontSize: 'var(--font-size-28)',
                                }}
                            />
                        </Link>
                        <Link to={props.isLoggedIn ? '#' : props.isAdmin ? '/admin' : '/auth'} onClick={handleLogout}>
                            <LogoutRounded
                                style={{
                                    color: 'var(--color-text-icon-default-primary)',
                                    fontSize: 'var(--font-size-28)',
                                }}
                            />
                        </Link>
                    </div>
                )
            ) : null}
        </header>
    );
};

function mapStateToProps(state: AppState): HeaderStateProps {
    return {
        user: state.appReducer.user,
        isLoggedIn: state.appReducer.isLoggedIn
    };
}

function mapDispatchToProps(dispatch: Dispatch<AppAction>): HeaderDispatchProps {
    return {
        onLogOut: () => dispatch(logOut())
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);
