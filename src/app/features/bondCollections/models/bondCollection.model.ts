// Un pago de bono pendiente de registrar para una tenencia puntual (cuenta + cartera).
// estimatedCapital/estimatedInterest vienen null si el bono es indexado (CER / dólar linked):
// el monto no se conoce de antemano y se carga a mano.
export interface BondCollectionPending {
    bondPaymentId: number;
    assetId: number;
    assetName: string;
    symbol: string;
    paymentDate: string;
    accountId: number;
    accountName: string;
    portfolioId: number;
    portfolioName: string;
    heldQuantity: number;
    currencySymbol: string;
    isIndexed: boolean;
    estimatedCapital: number | null;
    estimatedInterest: number | null;
}

export type BondCollectionStatus = 'Registered' | 'Untracked' | 'Dismissed';

export interface BondCollectionListItem {
    id: number;
    assetId: number;
    assetName: string;
    symbol: string;
    paymentDate: string;
    accountName: string;
    portfolioName: string;
    status: BondCollectionStatus;
    collectionDate: string | null;
    capitalAmount: number;
    interestAmount: number;
    currencySymbol: string;
}

export interface BondCollectionRegister {
    bondPaymentId: number;
    accountId: number;
    portfolioId: number;
    collectionDate: string;
    capitalAmount: number;
    interestAmount: number;
    interestTransactionClassId: number | null;
}

export interface BondCollectionDismiss {
    bondPaymentId: number;
    accountId: number;
    portfolioId: number;
}
