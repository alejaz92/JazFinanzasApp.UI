export interface SharedEventParticipant {
  personId: number;
  personName: string;
}

export interface SharedEventListItem {
  id: number;
  name: string;
  isClosed: boolean;
  tripId: number | null;
  tripName: string | null;
  participantCount: number;
  movementCount: number;
}

export interface SharedEventAddRequest {
  name: string;
  notes?: string;
  tripId?: number | null;
  personIds: number[];
}

export interface SharedEventEditRequest {
  name: string;
  notes?: string;
  tripId?: number | null;
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

export interface SharedEventPaymentAllocationInput {
  splitId?: number | null;
  shareId?: number | null;
  amount: number;
}

export interface SharedEventPaymentAddRequest {
  date: string;
  assetId: number;
  amount: number;
  fromPersonId?: number | null;
  toPersonId?: number | null;
  accountId?: number | null;
  isInternalCompensation: boolean;
  notes?: string;
  allocations?: SharedEventPaymentAllocationInput[];
}

export interface SharedEventPaymentPreviewItem {
  kind: 'Credit' | 'Debt';
  splitId: number | null;
  shareId: number | null;
  movementId: number;
  movementDescription: string;
  movementDate: string;
  personId: number | null;
  personName: string | null;
  amount: number;
  pendingBefore: number;
  pendingAfter: number;
}

export interface SharedEventPaymentPreview {
  creditsAllocated: number;
  debtsAllocated: number;
  items: SharedEventPaymentPreviewItem[];
}

export interface SharedEventDetail {
  id: number;
  name: string;
  notes: string | null;
  isClosed: boolean;
  tripId: number | null;
  tripName: string | null;
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

// ── Import de Splitwise ────────────────────────────────────────────────

export interface SharedEventImportMember {
  name: string;
  suggestedPersonId: number | null;
  suggestedPersonName: string | null;
}

export interface SharedEventImportCategory {
  name: string;
  suggestedTransactionClassId: number | null;
  suggestedTransactionClassName: string | null;
}

export interface SharedEventImportMemberDelta {
  memberName: string;
  delta: number;
}

export interface SharedEventImportSuggestedMatch {
  transactionId: number | null;
  cardTransactionId: number | null;
  date: string;
  amount: number;
  detail: string;
}

export interface SharedEventImportRow {
  rowIndex: number;
  date: string;
  description: string;
  category: string;
  cost: number;
  currency: string;
  assetId: number | null;
  isPayment: boolean;
  unsupported: boolean;
  payerMemberName: string | null;
  receiverMemberName: string | null;
  memberDeltas: SharedEventImportMemberDelta[];
  suggestedMatches: SharedEventImportSuggestedMatch[];
}

export interface SharedEventImportBalanceRow {
  currency: string;
  memberBalances: SharedEventImportMemberDelta[];
}

export interface SharedEventImportParseResult {
  members: SharedEventImportMember[];
  categories: SharedEventImportCategory[];
  rows: SharedEventImportRow[];
  balanceRows: SharedEventImportBalanceRow[];
  warnings: string[];
}

export interface SharedEventImportParseRequest {
  csvContent: string;
  currentUserMemberName?: string;
}

export interface SharedEventImportMemberMapping {
  memberName: string;
  personId?: number | null;
  newPersonName?: string;
  isCurrentUser: boolean;
}

export interface SharedEventImportCategoryMapping {
  categoryName: string;
  transactionClassId?: number | null;
  newCategoryName?: string;
}

export type SharedEventImportRowAction = 'CreateNew' | 'LinkExisting' | 'Skip';

export interface SharedEventImportRowDecision {
  rowIndex: number;
  action: SharedEventImportRowAction;
  transactionId?: number | null;
  cardTransactionId?: number | null;
  accountId?: number | null;
  cardId?: number | null;
  installments?: number | null;
  firstInstallment?: string | null;
}

export interface SharedEventImportConfirmRequest {
  csvContent: string;
  memberMappings: SharedEventImportMemberMapping[];
  categoryMappings: SharedEventImportCategoryMapping[];
  rowDecisions: SharedEventImportRowDecision[];
}

export interface SharedEventImportConfirmResult {
  movementsCreated: number;
  paymentsCreated: number;
  skipped: number;
  errors: string[];
}
