export interface Movement {
    id: number;
    accountId: number;
    accountName: string;
    assetId: number;
    assetName: string;
    date: Date;
    movementType: string;
    movementClassId?: number;
    movementClassName?: string;
    detail: string;
    amount: number;
  }