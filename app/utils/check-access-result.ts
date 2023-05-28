export enum AccessType {
    ACCESS,
    FORBIDDEN
}

export interface CheckAccessResult {
    type: AccessType,
    message?: string | undefined,
}