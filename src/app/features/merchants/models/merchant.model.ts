export interface MerchantListItem {
    id: number;
    name: string;
    isConfirmed: boolean;
    volume: number;
}

export interface MerchantMovement {
    id: number;
    source: 'Transaction' | 'CardTransaction';
    date: Date;
    detail?: string | null;
    amount: number;
}

export interface MerchantResolveBulkResult {
    transactionsResolved: number;
    cardTransactionsResolved: number;
    merchantsCreated: number;
}
