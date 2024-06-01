import React, { useEffect, useState } from 'react';
import classes from './custom-input.module.scss';
import { InputProps } from '../../entities/custom-input/custom-input.interfaces';
import { FormControl, FormHelperText, IconButton, InputAdornment, OutlinedInput } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export const CustomInput: React.FC<InputProps> = props => {
    const [mediaMatch, setMediaMatch] = useState<MediaQueryList>(window.matchMedia('(max-width: 600px)'));

    useEffect(() => {
        const resizeEventHandler = () => {
            setMediaMatch(window.matchMedia('(max-width: 600px)'));
        };

        mediaMatch.addEventListener('change', resizeEventHandler);

        return () => {
            mediaMatch.removeEventListener('change', resizeEventHandler);
        };
    }, []);

    const [values, setValues] = useState({
        password: '',
        showPassword: false,
    });

    let required: boolean;
    if (props.required !== undefined) {
        required = props.required;
    } else {
        required = true;
    }

    const cls = [classes.Input];

    if (props.isInvalid && !cls.includes(classes.invalid)) {
        cls.push(classes.invalid);
    }

    if (!props.isInvalid && cls.includes(classes.invalid)) {
        cls.splice(1, 1);
    }

    const handleClickShowPassword = () => {
        setValues({
            ...values,
            showPassword: !values.showPassword,
        });
    };

    return (
        <FormControl
            variant='outlined'
            sx={{ marginBottom: mediaMatch.matches ? '5%' : '3%' }}
            fullWidth={true}
            style={props.style}
        >
            <OutlinedInput
                className={cls.join(' ')}
                fullWidth={true}
                autoComplete={props.type === 'password' ? 'on' : props.autocomplete ? 'on' : 'off'}
                type={values.showPassword && props.type === 'password' ? 'text' : props.type}
                id={props.id}
                error={props.isInvalid}
                name={props.name}
                placeholder={props.placeholder}
                defaultValue={props.defaultValue}
                value={props.value}
                onBlur={props.onBlur}
                onChange={props.onChange}
                required={required}
                onFocus={props.onFocus}
                readOnly={props.readonly}
                endAdornment={
                    props.type === 'password' ? (
                        <InputAdornment position='end'>
                            <IconButton
                                onClick={handleClickShowPassword}
                                edge='end'
                            >
                                {values.showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ) : null
                }
            />
            {props.isInvalid && props.errorHelperText ? (
                <FormHelperText
                    sx={{
                        marginLeft: '0 !important',
                        fontSize: mediaMatch.matches ? '3.5vw' : '1vmax',
                        color: '#FF0000',
                        position: 'absolute',
                        top: mediaMatch.matches ? '12.5vw' : '6.7vh',
                    }}
                >
                    {props.errorHelperText}
                </FormHelperText>
            ) : null}
        </FormControl>
    );
};
