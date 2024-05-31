import React from 'react';
import classes from './page-wrapper.module.scss';

const PageWrapper: React.FC = props => {
    return (
        <div className={classes.PageWrapper}>
            {props.children}
        </div>
    );
};

export default PageWrapper;