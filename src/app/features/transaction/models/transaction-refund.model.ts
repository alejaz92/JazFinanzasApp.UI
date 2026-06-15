export interface SplitAllocation {
  splitId: number;
  amount: number;
}

export interface TransactionRefund {
  accountId: number;
  date: Date;
  amount: number;
  splitAllocations?: SplitAllocation[];
}
