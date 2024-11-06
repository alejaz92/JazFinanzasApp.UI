export interface CardMovementPaymentList {
    date: string;
    movementClassId: number;
    movementClass: string;
    detail: string;
    assetId: number;
    asset: string;
    installment: string;
    installmentAmount: number;
    valueInPesos: number;
    Pay: boolean | true;
  }