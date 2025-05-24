export interface Transaction {
    id: number;
    accountId: number;
    accountName: string;
    portfolioId: number;
    portfolioName: string;
    assetId: number;
    assetName: string;
    assetSymbol: string;
    date: Date;
    movementType: string;
    transactionClassId?: number;
    transactionClassName?: string;
    detail: string;
    amount: number;
  }