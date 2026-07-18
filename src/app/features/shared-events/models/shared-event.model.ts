export interface SharedEventParticipant {
  personId: number;
  personName: string;
}

export interface SharedEventListItem {
  id: number;
  name: string;
  isClosed: boolean;
  participantCount: number;
  movementCount: number;
}

export interface SharedEventAddRequest {
  name: string;
  notes?: string;
  personIds: number[];
}

export interface SharedEventEditRequest {
  name: string;
  notes?: string;
}

export interface SharedEventParticipantAddRequest {
  personId: number;
}

export interface SharedEventMovementShareInput {
  personId: number | null; // null = la parte del usuario
  amount: number;
}

export interface SharedEventMovementPaymentInput {
  accountId?: number | null;
  cardId?: number | null;
  installments?: number | null;
  firstInstallment?: string | null;
}

export interface SharedEventMovementAddRequest {
  date: string;
  description: string;
  transactionClassId: number;
  assetId: number;
  totalAmount: number;
  payerPersonId: number | null;
  shares: SharedEventMovementShareInput[];
  payment: SharedEventMovementPaymentInput | null;
  notes?: string;
}

export interface SharedEventMovementShare {
  id: number;
  personId: number | null;
  personName: string | null;
  amount: number;
  amountSettled: number;
  pending: number;
}

export interface SharedEventMovement {
  id: number;
  date: string;
  description: string;
  transactionClassId: number;
  transactionClassName: string;
  assetId: number;
  assetName: string;
  assetSymbol: string;
  totalAmount: number;
  payerPersonId: number | null;
  payerPersonName: string | null;
  transactionId: number | null;
  cardTransactionId: number | null;
  sharedExpenseId: number | null;
  notes: string | null;
  shares: SharedEventMovementShare[];
}

export interface SharedEventBalance {
  assetId: number;
  assetName: string;
  assetSymbol: string;
  personId: number | null;
  personName: string | null;
  contributed: number;
  consumed: number;
  netBalance: number;
}

export interface SharedEventCategoryTotal {
  assetId: number;
  assetName: string;
  assetSymbol: string;
  transactionClassId: number;
  transactionClassName: string;
  total: number;
}

export interface SharedEventPaymentAllocation {
  id: number;
  splitId: number | null;
  shareId: number | null;
  amount: number;
}

export interface SharedEventPayment {
  id: number;
  date: string;
  assetId: number;
  assetName: string;
  assetSymbol: string;
  amount: number;
  fromPersonId: number | null;
  fromPersonName: string | null;
  toPersonId: number | null;
  toPersonName: string | null;
  accountId: number | null;
  isInternalCompensation: boolean;
  notes: string | null;
  allocations: SharedEventPaymentAllocation[];
}

export interface SharedEventDetail {
  id: number;
  name: string;
  notes: string | null;
  isClosed: boolean;
  participants: SharedEventParticipant[];
  movements: SharedEventMovement[];
  balances: SharedEventBalance[];
  categoryTotals: SharedEventCategoryTotal[];
  payments: SharedEventPayment[];
}

export interface SharedEventActiveSummary {
  eventId: number;
  name: string;
  balances: { assetId: number; assetName: string; assetSymbol: string; myBalance: number }[];
}

export interface SharedEventConsolidatedDebt {
  personId: number;
  personName: string;
  assetId: number;
  assetName: string;
  assetSymbol: string;
  pendingInFavor: number;
  pendingAgainst: number;
}
