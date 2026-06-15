export interface SplitInput {
  personId: number;
  amount: number;
  notes?: string;
}

export interface SharedExpenseFormData {
  splits: SplitInput[];
  notes: string;
}

export interface SharedExpenseSplit {
  id: number;
  personId: number;
  personName: string;
  amount: number;
  amountReimbursed: number;
  status: number; // 0=Pending, 1=PartiallyPaid, 2=Paid
  notes?: string;
}

export interface SharedExpenseDetail {
  id: number;
  transactionId: number;
  notes?: string;
  splits: SharedExpenseSplit[];
}

export interface SharedExpenseAdd {
  transactionId: number;
  notes?: string;
  splits: SplitInput[];
}

export interface PersonDebtSummary {
  personId: number;
  personName: string;
  totalPending: number;
}
