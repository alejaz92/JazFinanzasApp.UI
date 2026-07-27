export interface TripLinkedEventTotal {
    assetId: number;
    assetName: string;
    assetSymbol: string;
    amount: number;
}

export interface TripLinkedEvent {
    id: number;
    name: string;
    isClosed: boolean;
    participantCount: number;
    movementCount: number;
    totals: TripLinkedEventTotal[];
}
