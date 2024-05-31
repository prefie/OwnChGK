import React from 'react';
import classes from './checkbox-block.module.scss';
import {Checkbox} from '@mui/material';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import {CheckboxBlockProps} from '../../entities/custom-checkbox/custom-checkbox.interfaces';

const CheckboxBlock: React.FC<CheckboxBlockProps> = props => {
    return (
        <div className={classes.checkboxBlock} style={props.style}>
            <div className={classes.labelWrapper}>
                {props.name}
            </div>

            <Checkbox
                name={props.name}
                onChange={props.onChange}
                sx={{
                    color: 'var(--color-fill-accent-enabled)',
                    fontSize: 32,
                    '&.Mui-checked': {
                        color: 'var(--color-fill-accent-enabled)',
                    },
                    '&.MuiCheckbox-root': {
                        padding: '.5rem'
                    },
                    '& .MuiSvgIcon-root': {
                        fontSize: 32
                    }
                }}
                checkedIcon={<CheckBoxOutlinedIcon/>}
                defaultChecked={props.checked}/>
        </div>
    );
};

export default CheckboxBlock;