export enum GameCreatorMode {
    creation = 'creation',
    edit = 'edit'
}

export interface GameCreatorProps {
    mode: GameCreatorMode;
    isAdmin: boolean
}