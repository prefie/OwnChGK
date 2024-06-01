import React from 'react';
import classes from './wrapper.module.scss';

class Wrapper extends React.Component {
    render() {
        return (
            <div className={classes.Wrapper}>
                <main>{this.props.children}</main>
            </div>
        );
    }
}

export default Wrapper;
