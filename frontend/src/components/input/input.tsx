import React, {FC, useEffect, useState} from 'react';
import {InputProps} from '../../entities/custom-input/custom-input.interfaces';
import {
    FormControl,
    FormHelperText,
    IconButton, IconButtonProps,
    InputAdornment,
    OutlinedInput,
    OutlinedInputProps,
    styled
} from '@mui/material';
import {Visibility, VisibilityOff} from '@mui/icons-material';

const StyledInput = styled(OutlinedInput)<OutlinedInputProps>({
    backgroundColor: "var(--color-bg-plates)",
    color: "var(--color-text-icon-primary)",
    fontSize: "var(--font-size-24)",
    lineHeight: "var(--line-height-small)",
    borderRadius: 8
});

const StyledIconButton = styled(IconButton)<IconButtonProps>({
    color: "var(--color-text-icon-secondary)"
});

export const Input: FC<InputProps> = props => {
    const [mediaMatch, setMediaMatch] = useState<MediaQueryList>(window.matchMedia('(max-width: 600px)'));

    useEffect(() => {
        const resizeEventHandler = () => {
            setMediaMatch(window.matchMedia('(max-width: 600px)'));
        }

        mediaMatch.addEventListener('change', resizeEventHandler);

        return () => {
            mediaMatch.removeEventListener('change', resizeEventHandler);
        };
    }, []);

    const [values, setValues] = useState({
        password: '',
        showPassword: false
    });

    let required: boolean;
    if (props.required !== undefined) {
        required = props.required;
    } else {
        required = true;
    }

    const handleClickShowPassword = () => {
        setValues({
            ...values,
            showPassword: !values.showPassword,
        });
    };

    return (
        <FormControl variant='outlined' sx={{marginBottom: mediaMatch.matches ? '5%' : ''}} fullWidth={true}
                     style={props.style}>
            <StyledInput
                fullWidth={true}
                autoComplete={props.type === 'password' ? 'on' : (props.autocomplete ? 'on' : 'off')}
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
                    props.type === 'password'
                        ?
                        <InputAdornment position="end">
                            <StyledIconButton
                                onClick={handleClickShowPassword}
                                edge="end"
                                size={"large"}
                            >{values.showPassword ? <VisibilityOff/> : <Visibility/>}
                            </StyledIconButton>
                        </InputAdornment>
                        :
                        null
                }
            />
            {
                props.isInvalid && props.errorHelperText
                    ?
                    <FormHelperText sx={{
                        marginLeft: '0 !important',
                        fontSize: "var(--font-size-20)",
                        color: 'var(--color-text-icon-error)',
                    }}>
                        {props.errorHelperText}
                    </FormHelperText>
                    : null
            }
        </FormControl>
    );
};
