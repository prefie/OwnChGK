import {styled} from "@mui/material";
import Button, {ButtonProps} from "@mui/material/Button";
import React from "react";

const PrimaryButton = styled(Button)<ButtonProps>({
    textTransform: "none",
    textDecoration: "none",
    fontFamily: "var(--font-family-primary)",
    fontSize: "var(--font-size-32)",
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
    }
});

export enum ButtonType {
    primary,
    secondary,
    disabled,
    link,
}

interface CustomButtonProps {
    text: string;
    type: "button" | "submit" | "reset" | undefined;
    buttonType: ButtonType;
    startIcon: React.ReactNode | null;
    endIcon: React.ReactNode | null;
}

function CustomButton(props: CustomButtonProps) {
    return (
        <PrimaryButton startIcon={props.startIcon}
                       type={props.type}
                       variant={"contained"}
                       endIcon={props.endIcon}
        >{props.text}
        </PrimaryButton>
    );
}

CustomButton.defaultProps = {
    startIcon: null,
    endIcon: null
}

export default CustomButton;
