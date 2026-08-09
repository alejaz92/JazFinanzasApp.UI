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

    // Parte propia según el Evento Compartido vinculado. Todo en null/false cuando el movimiento no
    // pertenece a ningún evento (incluye sugerencias y búsqueda de asociables).
    ownAmount?: number;
    isShared: boolean;
    sharedEventId?: number;
    sharedWith?: string[];
    grossAmount?: number;
    paidByName?: string;
}

export interface TripMovementRef {
    type: TripMovementOrigin;
    id: number;
}
