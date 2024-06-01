import React from 'react';

export interface CheckboxBlockProps {
    name: string;
    checked?: boolean;
    onChange?: (event: React.SyntheticEvent) => void;
    style?: object;
}
