export type TripMovementOrigin = 'ACCOUNT' | 'CARD';

export interface TripMovement {
    id: number;
    origin: TripMovementOrigin;
    date: string;
    transactionClass?: string;
    detail?: string;
    amount: number;
    asset: string;
    assetSymbol: string;
}

export interface TripMovementRef {
    type: TripMovementOrigin;
    id: number;
}
