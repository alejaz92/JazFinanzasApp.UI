export interface Transaction {
    id: number;
    accountId: number;
    accountName: string;
    assetId: number;
    assetName: string;
    date: Date;
    movementType: string;
    transactionClassId?: number;
    transactionClassName?: string;
    detail: string;
    amount: number;
  }