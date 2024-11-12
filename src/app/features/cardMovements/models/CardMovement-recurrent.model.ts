export interface RecurrentCardMovementGet {
    id: number;
    date: Date;
    firstInstallment: Date;
    card: string;
    description: string;
    amount: number;
}

export interface RecurrentCardMovementPut {
    isUpdate: boolean;
    newDate: Date;
    newAmount?: number;
}