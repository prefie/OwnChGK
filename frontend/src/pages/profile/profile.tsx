import React, {FC, useState} from 'react';
import classes from './profile.module.scss';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import {ProfileDispatchProps, ProfileProps, ProfileStateProps} from '../../entities/profile/profile.interfaces';
import Header from '../../components/header/header';
import {Alert, Snackbar} from '@mui/material';
import PageBackdrop from '../../components/backdrop/backdrop';
import {AppState} from '../../entities/app/app.interfaces';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {AppAction} from '../../redux/reducers/app-reducer/app-reducer.interfaces';
import {addUserName} from '../../redux/actions/app-actions/app-actions';
import {Input} from "../../components/input/input";
import DemoVersionFrame from "../../components/demoversion-frame/demoversion-frame";
import CustomButton, {ButtonType} from "../../components/custom-button/custom-button";
import {ServerApi} from "../../server-api/server-api";

const Profile: FC<ProfileProps> = props => {
    const [userName, setUserName] = useState<string>(props.userName);
    const [userPassword, setUserPassword] = useState<string>('');
    const [userOldPassword, setUserOldPassword] = useState<string>('');
    const [repeatedPassword, setRepeatedPassword] = useState<string>('');
    const [isRepeatedPasswordInvalid, setIsRepeatedPasswordInvalid] = useState<boolean>(false);
    const [isOldPasswordInvalid, setIsOldPasswordInvalid] = useState<boolean>(false);
    const [flags, setFlags] = useState<{isSuccess: boolean, isSnackbarOpen: boolean, isLoading: boolean}>({isSuccess: true, isSnackbarOpen: false, isLoading: false});
    const userTeam = props.userTeam;
    const userEmail = props.userEmail;

    const checkRepeatedPassword = () => {
        if (userPassword !== repeatedPassword) {
            setIsRepeatedPasswordInvalid(true);
            return false;
        } else {
            setIsRepeatedPasswordInvalid(false);
            return true;
        }
    };

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setFlags({isSuccess: flags.isSuccess, isSnackbarOpen: false, isLoading: false});
    };

    const clearAfterSave = () => {
        setIsOldPasswordInvalid(false);
        setUserOldPassword('');
        setUserPassword('');
        setRepeatedPassword('');
    }

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setIsOldPasswordInvalid(false);

        setFlags({isSuccess: true, isSnackbarOpen: false, isLoading: true});
        if (userPassword === '') {
            ServerApi.changeName(userName, props.isAdmin)
                .then(res => {
                    if (res.status === 200) {
                        setFlags({isSuccess: true, isSnackbarOpen: true, isLoading: false});
                        props.onAddUserName(userName);
                    } else {
                        setFlags({isSuccess: false, isSnackbarOpen: true, isLoading: false});
                    }
                });

            clearAfterSave();
            return false;
        } else if (userOldPassword === '') {
            setIsOldPasswordInvalid(true);
            return false;
        } else {
            if (checkRepeatedPassword()) {
                ServerApi.changePassword(userEmail, userPassword, userOldPassword, props.isAdmin)
                    .then(res => {
                        if (res.status === 200) {
                            setFlags({isSuccess: true, isSnackbarOpen: false, isLoading: true});
                            return 'success';
                        } else if (res.status === 403) {
                            setIsOldPasswordInvalid(true);
                            return 'old password invalid';
                        } else {
                            setFlags({isSuccess: false, isSnackbarOpen: false, isLoading: true});
                            return 'something went wrong';
                        }
                    }).then((res) => {
                        if (res === 'old password invalid') {
                            setFlags({isSuccess: false, isSnackbarOpen: false, isLoading: false});
                        } else if (res === 'success') {
                            ServerApi.changeName(userName, props.isAdmin)
                                .then(res => {
                                    if (res.status === 200) {
                                        props.onAddUserName(userName);
                                        return 'success';
                                    } else {
                                        return 'fail';
                                    }
                                }).then((res) => {
                                    if (res === 'success') {
                                        setFlags({isSuccess: true, isSnackbarOpen: true, isLoading: false});
                                    } else {
                                        setFlags({isSuccess: false, isSnackbarOpen: true, isLoading: false});
                                    }
                                    clearAfterSave();
                                });
                        } else {
                            setFlags({isSuccess: false, isSnackbarOpen: true, isLoading: false});
                            clearAfterSave();
                        }
                    });
            } else {
                setFlags({isSuccess: false, isSnackbarOpen: false, isLoading: false});
            }
        }
    };

    const handleUserOldPassportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserOldPassword(event.target.value);
    };

    const handleUserPassportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserPassword(event.target.value);
    };

    const handleRepeatedPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRepeatedPassword(event.target.value);
    };

    const handleUserNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserName(event.target.value);
    };

    return (
            <PageWrapper>
                <Header isAuthorized={true} isAdmin={props.isAdmin}>
                    <div className={classes.pageTitle}>Профиль</div>
                </Header>

                <form className={classes.box} onSubmit={handleSubmit} autoComplete='off'>
                    <div className={classes.contentWrapper}>
                        <div className={classes.infoAndDemoWrapper}>
                            <div className={classes.infoWrapper}>
                                <Input type={'text'}
                                       id={'name'}
                                       placeholder={"Можете указать ваше имя"}
                                       defaultValue={userName}
                                       required={false}
                                       value={userName}
                                       onChange={handleUserNameChange}/>
                                {
                                    !props.isAdmin && props.userTeam
                                        ?
                                        <div className={classes.infoCategoryWrapper}>
                                            <p className={classes.category}>Команда</p>
                                            <p className={classes.userData}>{userTeam}</p>
                                        </div>
                                        : null
                                }

                                <div className={classes.infoCategoryWrapper} style={{marginTop: '3vh'}}>
                                    <p className={classes.category}>Почта</p>
                                    <p id='email' className={classes.userData}>{userEmail}</p>
                                </div>
                            </div>
                            <DemoVersionFrame isAdmin={props.isAdmin} role={props.role}/>
                        </div>
                        <div className={classes.changePasswordWrapper}>
                            <h3 className={classes.changePasswordParagraph}>Изменение пароля</h3>

                            <Input type="password" id="old-password" name="old-password"
                                         placeholder="Введите старый пароль" style={{marginBottom: '3.5vh'}}
                                         isInvalid={isOldPasswordInvalid} required={false} value={userOldPassword}
                                         onChange={handleUserOldPassportChange}
                                         errorHelperText='Неверный старый пароль'
                                         onFocus={() => setIsOldPasswordInvalid(false)}/>
                            <Input type="password" id="new-password" name="new-password"
                                         placeholder="Введите новый пароль" isInvalid={isRepeatedPasswordInvalid}
                                         required={false} value={userPassword}
                                         onChange={handleUserPassportChange}
                                         onFocus={() => setIsRepeatedPasswordInvalid(false)}/>
                            <Input type="password" id="repeat-new-password" name="repeat-new-password"
                                         placeholder="Повторите новый пароль" isInvalid={isRepeatedPasswordInvalid}
                                         value={repeatedPassword} onChange={handleRepeatedPasswordChange}
                                         onBlur={checkRepeatedPassword} required={false}
                                         errorHelperText='Пароли не совпадают'
                                         onFocus={() => setIsRepeatedPasswordInvalid(false)}/>
                            <div className={classes.buttonWrapper}>
                                <CustomButton id={"saveProfile"} type={"submit"} text={"Сохранить"} buttonType={ButtonType.primary}/>
                            </div>
                        </div>
                    </div>
                </form>
                <Snackbar open={flags.isSnackbarOpen} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity={flags.isSuccess ? 'success' : 'error'} sx={{width: '100%'}}>
                        {flags.isSuccess ? 'Изменения успешно сохранены' : 'Не удалось сохранить изменения'}
                    </Alert>
                </Snackbar>
                <PageBackdrop isOpen={flags.isLoading} />
            </PageWrapper>
        );
};

function mapStateToProps(state: AppState): ProfileStateProps {
    return {
        userName: state.appReducer.user.name,
        userEmail: state.appReducer.user.email,
        userTeam: state.appReducer.user.team
    };
}

function mapDispatchToProps(dispatch: Dispatch<AppAction>): ProfileDispatchProps {
    return {
        onAddUserName: (name: string) => dispatch(addUserName(name))
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Profile);