import {styled} from "@mui/material";
import Button, {ButtonProps} from "@mui/material/Button";
import React from "react";

const PrimaryButton = styled(Button)<ButtonProps>({
    textTransform: "none",
    textDecoration: "none",
    fontFamily: "var(--font-family-primary)",
    fontSize: "var(--font-size-24)",
    lineHeight: "var(--line-height-small)",
    height: "auto",
    backgroundColor: "var(--color-fill-accent-enabled)",
    color: "var(--color-text-icon-primary)",
    border: "none",
    borderRadius: 8,
    padding: ".75rem 1.5rem",
    '&:hover': {
        backgroundColor: "var(--color-fill-accent-hover)",
        cursor: "pointer"
    },
    '&:active': {
        backgroundColor: "var(--color-fill-accent-pressed)"
    },
    '&:disabled': {
        backgroundColor: "var(--color-fill-accent-disabled)",
        color: "var(--color-text-icon-disabled)"
    }
});

const MobilePrimaryButton = styled(PrimaryButton)<ButtonProps>({
    fontSize: "var(--font-size-24)"
});

export enum ButtonType {
    primary,
    secondary,
    link,
}

interface CustomButtonProps {
    id?: string;
    text: string;
    type: "button" | "submit" | "reset" | undefined;
    buttonType: ButtonType;
    disabled?: boolean;
    isMobile?: boolean;
    startIcon: React.ReactNode | null;
    endIcon: React.ReactNode | null;
}

function CustomButton(props: CustomButtonProps) {
    if (!props.isMobile) {
        return (
            <PrimaryButton
                id={props.id}
                startIcon={props.startIcon}
                type={props.type}
                variant={"contained"}
                disabled={props.disabled}
                endIcon={props.endIcon}
            >{props.text}
            </PrimaryButton>
        );
    } else {
        return (
            <MobilePrimaryButton
                id={props.id}
                startIcon={props.startIcon}
                type={props.type}
                variant={"contained"}
                disabled={props.disabled}
                endIcon={props.endIcon}
            >{props.text}
            </MobilePrimaryButton>
        );
    }

}

CustomButton.defaultProps = {
    startIcon: null,
    endIcon: null,
    disabled: false,
    isMobile: false
}

export default CustomButton;
