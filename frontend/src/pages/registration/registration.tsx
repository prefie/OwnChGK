import React, { useState } from 'react';
import classes from './registration.module.scss';
import Header from '../../components/header/header';
import { Link, Redirect } from 'react-router-dom';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import { RegistrationDispatchProps, RegistrationProps } from '../../entities/registration/registration.interfaces';
import { Dispatch } from 'redux';
import { AppAction } from '../../redux/reducers/app-reducer/app-reducer.interfaces';
import { authorizeUserWithRole } from '../../redux/actions/app-actions/app-actions';
import { connect } from 'react-redux';
import PageBackdrop from '../../components/backdrop/backdrop';
import { Input } from '../../components/input/input';
import CustomButton, { ButtonType } from '../../components/custom-button/custom-button';
import { ServerApi } from '../../server-api/server-api';
import logoImage from '../../images/Logo.svg';

const Registration: React.FC<RegistrationProps> = props => {
    const [isRepeatedPasswordInvalid, setIsRepeatedPasswordInvalid] = useState<boolean>(false);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [repeatedPassword, setRepeatedPassword] = useState<string>('');
    const [isError, setIsError] = useState<boolean>(false);
    const [isRegisteredAlready, setIsRegisteredAlready] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const checkRepeatedPassword = () => {
        if (password !== repeatedPassword) {
            setIsRepeatedPasswordInvalid(true);
            return false;
        } else {
            setIsRepeatedPasswordInvalid(false);
            return true;
        }
    };

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    const handleRepeatedPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRepeatedPassword(event.target.value);
    };

    const validateForm = async (event: React.SyntheticEvent) => {
        event.preventDefault();

        setIsError(false);
        if (!checkRepeatedPassword()) {
            return false;
        } else {
            setIsLoading(true);
            ServerApi.createUser(email, password).then(response => {
                if (response.status === 200) {
                    props.onAuthorizeUserWithRole('user', '', email, '');
                    setLoggedIn(true);
                } else if (response.status === 409) {
                    setIsRegisteredAlready(true);
                    setIsLoading(false);
                } else {
                    setIsError(true);
                    setIsLoading(false);
                }
            });
        }
    };

    if (loggedIn) {
        return <Redirect to='/start-screen' />;
    }

    return (
        <PageWrapper>
            <Header
                isAuthorized={false}
                isAdmin={false}
            />

            <div className={classes.contentWrapper}>
                <img
                    className={classes.logo}
                    src={logoImage}
                    alt='logo'
                />

                <form
                    onSubmit={validateForm}
                    className={classes.authForm}
                >
                    <Input
                        type='email'
                        id='email'
                        placeholder='Почта'
                        style={{ marginBottom: '2rem' }}
                        value={email}
                        onChange={handleEmailChange}
                        isInvalid={isError || isRegisteredAlready}
                        errorHelperText={isRegisteredAlready ? 'Эта почта уже зарегистрирована' : ''}
                        autocomplete={true}
                        onFocus={() => {
                            setIsRegisteredAlready(false);
                            setIsError(false);
                        }}
                    />
                    <Input
                        type='password'
                        id='password'
                        placeholder='Пароль'
                        value={password}
                        onChange={handlePasswordChange}
                        isInvalid={isRepeatedPasswordInvalid || isError}
                        autocomplete={true}
                    />
                    <Input
                        type='password'
                        id='repeatPassword'
                        placeholder='Ещё раз пароль'
                        value={repeatedPassword}
                        onChange={handleRepeatedPasswordChange}
                        isInvalid={isRepeatedPasswordInvalid || isError}
                        autocomplete={true}
                        errorHelperText={
                            isRepeatedPasswordInvalid
                                ? 'Пароли не совпадают'
                                : 'Не удалось зарегистрировать, попробуйте ещё раз'
                        }
                    />
                    <div className={classes.buttonWrapper}>
                        <CustomButton
                            type={'submit'}
                            text={'Зарегистрироваться'}
                            buttonType={ButtonType.primary}
                        />
                    </div>
                </form>

                <div className={classes.toAuthorizationWrapper}>
                    <p className={classes.toAuthorizationParagraph}>Уже есть аккаунт?</p>
                    <Link
                        className={classes.toAuthorizationLink}
                        to='/auth'
                        id='toAuthorization'
                    >
                        {' '}
                        Войти
                    </Link>
                </div>
                <PageBackdrop isOpen={isLoading} />
            </div>
        </PageWrapper>
    );
};

function mapDispatchToProps(dispatch: Dispatch<AppAction>): RegistrationDispatchProps {
    return {
        onAuthorizeUserWithRole: (role: string, team: string, email: string, name: string) =>
            dispatch(authorizeUserWithRole(role, team, email, name)),
    };
}

export default connect(null, mapDispatchToProps)(Registration);
