export enum TypeButton {
    Primary = 'primary',
    Default = 'default',
    Link = 'link',
}

export interface CustomButtonProps {
    type?: TypeButton | TypeButton.Default;
    content?: string;
    alt?: string;
    to?: string;
    onClick?: (event: Event) => void;
    hasLeftIcon?: boolean;
    hasRightIcon?: boolean;
    icon?: JSX.Element;
    className: string;
    disabled?: boolean | false;
    active?: boolean | false;
}
