import React from 'react';
import classes from './loader.module.scss';
import PageWrapper from '../page-wrapper/page-wrapper';
import Header from '../header/header';

const Loader: React.FC = () => {
    return (
        <PageWrapper>
            <Header isAuthorized={false} />
            <div className={classes.loader} />
        </PageWrapper>
    );
}

export default Loader;