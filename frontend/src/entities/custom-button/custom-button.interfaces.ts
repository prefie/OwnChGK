export enum TypeButton {
    Primary = 'primary',
    Default = 'default',
    Link = 'link',
}

export interface CustomButtonProps {
    type?: TypeButton | TypeButton.Default;
    content?: string;
    alt?: string;
    ref?: string;
    onClick: () => void;
    hasLeftIcon?: boolean;
    leftIcon?: Element;
    hasRightIcon?: boolean;
    rightIcon?: Element;
    className: string;
}
