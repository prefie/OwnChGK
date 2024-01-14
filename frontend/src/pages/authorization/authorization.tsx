import React, {FC, useState} from 'react';
import classes from './authorization.module.scss';
import Header from '../../components/header/header';
import {Link, Redirect} from 'react-router-dom';
import {
    AuthorizationDispatchProps,
    AuthorizationProps,
    AuthorizationStateProps
} from '../../entities/authorization/authorization.interfaces';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import {CustomInput} from '../../components/custom-input/custom-input';
import {connect} from 'react-redux';
import {AppAction} from '../../redux/reducers/app-reducer/app-reducer.interfaces';
import {Dispatch} from 'redux';
import {authorizeUserWithRole, checkToken as testToken} from '../../redux/actions/app-actions/app-actions';
import {AppState} from '../../entities/app/app.interfaces';
import PageBackdrop from '../../components/backdrop/backdrop';
import {ServerApi} from '../../server-api/server-api';
import CustomButton, {ButtonType} from "../../components/custom-button/custom-button";
import {Input} from "../../components/input/input";
import { allAdminRoles } from '../../entities/common/common.constants';
import logoImage from '../../images/Logo.svg';

const Authorization: FC<AuthorizationProps> = props => {
    const [wrongEmailOrPassword, setWrongEmailOrPassword] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (event: React.SyntheticEvent) => {
        event.preventDefault();
        setIsLoading(true);
        ServerApi.login(email, password, !!props.isAdmin).then(response => {
            if (response.status === 200) {
                response.json().then(({role, team, email, name}) => {
                    props.onAuthorizeUserWithRole(role, team, email, name);
                });
            } else {
                setIsLoading(false);
                setWrongEmailOrPassword(true);
            }
        });
    };

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    const handleErrorFixes = () => {
        if (wrongEmailOrPassword) {
            setPassword('');
            setWrongEmailOrPassword(false);
        }
    };

    return props.isLoggedIn ? (
        <Redirect
            to={allAdminRoles.includes(props.user.role) ? '/admin/start-screen' : '/start-screen'}/>
    ) : (
        <PageWrapper>
            <Header isAuthorized={false}/>

            <div className={classes.contentWrapper}>
                <img className={classes.logo} src={logoImage} alt="logo"/>

                <form onSubmit={handleSubmit} className={classes.authForm}>
                    <Input
                        type="email"
                        id="email"
                        placeholder="Почта"
                        value={email}
                        onChange={handleEmailChange}
                        isInvalid={wrongEmailOrPassword}
                        autocomplete={true}
                        onFocus={handleErrorFixes}
                    />
                    <Input
                        type="password"
                        id="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={handlePasswordChange}
                        isInvalid={wrongEmailOrPassword}
                        autocomplete={true}
                        onFocus={handleErrorFixes}
                        errorHelperText='Неверный логин или пароль'
                    />
                    <div className={classes.buttonWrapper}>
                        <CustomButton type={"submit"} text={"Войти"} buttonType={ButtonType.primary}/>
                    </div>
                </form>
                <div className={classes.restoreLinkWrapper}>
                    <Link className={classes.restorePasswordLink}
                          to={props.isAdmin ? '/admin/restore-password' : '/restore-password'}
                          id="restore">Восстановить пароль</Link>
                </div>

                {
                    props.isAdmin
                        ? null
                        :
                        <div className={classes.toRegistrationWrapper}>
                            <p className={classes.toRegistrationParagraph}>Ещё нет аккаунта?</p>
                            <Link className={classes.toRegistrationLink} to="/registration"
                                  id="toRegistration"> Зарегистрироваться</Link>
                        </div>
                }
            </div>
            <PageBackdrop isOpen={isLoading}/>
        </PageWrapper>
    );
};

function mapStateToProps(state: AppState): AuthorizationStateProps {
    return {
        isLoggedIn: state.appReducer.isLoggedIn,
        user: state.appReducer.user,
        isTokenChecked: state.appReducer.isTokenChecked
    };
}

function mapDispatchToProps(dispatch: Dispatch<AppAction>): AuthorizationDispatchProps {
    return {
        onCheckToken: () => dispatch(testToken()),
        onAuthorizeUserWithRole: (role: string, team: string, email: string, name: string) => dispatch(authorizeUserWithRole(role, team, email, name))
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Authorization);
