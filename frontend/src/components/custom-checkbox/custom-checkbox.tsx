import { Checkbox } from '@mui/material';
import React from 'react';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import classes from './custom-checkbox.module.scss';

interface CustomCheckboxProps {
    label: string;
    checked: boolean;
    onChange: (event: React.SyntheticEvent) => void;
}

function CustomCheckbox(props: CustomCheckboxProps) {
    return (
        <div className={classes.checkboxWrapper}>
            <Checkbox
                onChange={props.onChange}
                checked={props.checked}
                size={'medium'}
                sx={{
                    color: 'var(--color-text-icon-link-enabled)',
                    fontSize: 28,
                    padding: 0,
                    '&.Mui-checked': {
                        color: 'var(--color-fill-accent-enabled)'
                    }
                }}
                checkedIcon={<CheckBoxOutlinedIcon />}
            />
            <p className={classes.checkboxLabel}>{props.label}</p>
        </div>
    );
}

export default CustomCheckbox;
