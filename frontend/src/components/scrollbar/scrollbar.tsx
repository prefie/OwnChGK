import React from 'react';
import classes from './scrollbar.module.scss';
import { Scrollbars } from 'rc-scrollbars';

const Scrollbar: React.FC = props => {
    return (
        <Scrollbars
            autoHide
            autoHideTimeout={500}
            autoHideDuration={200}
            renderThumbVertical={() => (
                <div
                    style={{
                        backgroundColor: 'var(--color-text-icon-secondary)',
                        borderRadius: '.25rem',
                        cursor: 'pointer',
                    }}
                />
            )}
            renderTrackHorizontal={props => (
                <div
                    {...props}
                    style={{ display: 'none' }}
                />
            )}
            classes={{
                view: classes.scrollbarView,
                trackVertical: classes.verticalTrack,
            }}
        >
            {props.children}
        </Scrollbars>
    );
};

export default Scrollbar;
