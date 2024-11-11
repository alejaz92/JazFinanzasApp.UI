export interface RecurrentCardMovementGet {
    id: number;
    date: Date;
    card: string;
    description: string;
    amount: number;
}

export interface RecurrentCardMovementPut {
    isUpdate: boolean;
    date: Date;
    newAmount?: number;
}