import {ServerApi} from "../../server-api/server-api";
import {useState} from "react";
import {Redirect, Link} from "react-router-dom";
import classes from "./demoversion-frame.module.scss";

interface DemoVersionFrameProps {
    isAdmin: boolean;
    role: string;
}

function DemoVersionFrame(props: DemoVersionFrameProps) {
    const [isRedirect, setIsRedirect] = useState(false);

    const handleDemoLinkOnClick = () => {
        if (!props.isAdmin) {
            ServerApi.insertDemoAdmin().then(res => {
                if (res.status === 200) {
                    setIsRedirect(true);
                }
            })
        } else {
            ServerApi.insertDemoUser().then(res => {
                if (res.status === 200) {
                    setIsRedirect(true);
                }
            })
        }
    }

    if (isRedirect) {
        window.location.reload();
        return <Redirect to={`/auth`}/>
    }

    if (props.role === 'user') {
        return (
            <div className={classes.demoWrapper}>
                <h3 className={classes.demoTitle}>Демоверсия администратора</h3>
                <p className={classes.demoCaption}>Если хотите попробовать себя в роли админа, нажмите ссылку ниже. Мы
                    создадим для вас демо-аккаунт администратора на вашу почту пользователя.</p>
                <Link to={'#'} onClick={handleDemoLinkOnClick} className={classes.demoLink}>Попробовать демоверсию</Link>
            </div>
        );
    } else if (props.role === 'demoadmin') {
        return (
            <div className={classes.demoWrapper}>
                <h3 className={classes.demoTitle}>Выход из демоверсии</h3>
                <p className={classes.demoCaption}>Нажмите на ссылку ниже, и мы вернем вас обратно в интерфейс пользователя.</p>
                <Link to={'#'} onClick={handleDemoLinkOnClick} className={classes.demoLink}>Выйти из демоверсии</Link>
            </div>
        );
    } else
        return (<></>);
}

export default DemoVersionFrame;