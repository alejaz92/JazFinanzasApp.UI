export interface RecurrentCardTransactionGet {
    id: number;
    date: Date;
    firstInstallment: Date;
    card: string;
    description: string;
    amount: number;
}

export interface RecurrentCardTransactionPut {
    isUpdate: boolean;
    newDate: Date;
    newAmount?: number;
}