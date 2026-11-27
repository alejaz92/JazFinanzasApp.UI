import { RecurringExpenseDetail, RecurringExpenseListItem, RecurringExpenseMonth, RecurringExpensePayment } from '../models/recurring-expense.model';

// Datos de prueba compartidos por los specs de la sección.
export const listItem = (overrides: Partial<RecurringExpenseListItem> = {}): RecurringExpenseListItem => ({
  id: 1, name: 'Internet', transactionClassId: 30, transactionClass: 'Servicios', assetId: 1, assetSymbol: 'ARS', source: 'CARD', cardId: 10,
  cardName: 'Visa', accountId: null, accountName: null, frequency: 'MONTHLY', startMonth: '2026-08-01T00:00:00', endMonth: null, isActive: true,
  expectedAmount: 48056, currentMonthState: 'Estimated', currentMonthAmount: 48056,
  ...overrides
});

export const payment = (overrides: Partial<RecurringExpensePayment> = {}): RecurringExpensePayment => ({
  transactionId: 500, date: '2026-09-01T00:00:00', chargedEarly: false, chargedLate: false, amount: 47000, nativeAmount: 47000,
  nativeAssetSymbol: 'ARS', converted: false, cardId: 10, cardName: 'Visa', accountId: null, accountName: null, detail: '(Tarjeta | Recurrente) Internet',
  ...overrides
});

export const month = (overrides: Partial<RecurringExpenseMonth> = {}): RecurringExpenseMonth => ({
  month: '2026-10-01T00:00:00', state: 'Estimated', amount: 48056, isEstimate: true, converted: false, exceptionStatus: null, cardId: 10,
  cardName: 'Visa', accountId: null, accountName: null, payments: [],
  ...overrides
});

export const detail = (overrides: Partial<RecurringExpenseDetail> = {}): RecurringExpenseDetail => ({
  ...listItem(),
  notes: null,
  hasPayments: true,
  months: [
    month({ month: '2026-09-01T00:00:00', state: 'Paid', amount: 47000, isEstimate: false, cardId: null, cardName: null, payments: [payment()] }),
    month()
  ],
  ...overrides
});

export const accountDetail = (overrides: Partial<RecurringExpenseDetail> = {}): RecurringExpenseDetail => detail({
  id: 2, name: 'Alquiler', source: 'ACCOUNT', cardId: null, cardName: null, accountId: 20, accountName: 'Banco', expectedAmount: 500000,
  hasPayments: false,
  months: [month({ amount: 500000, cardId: null, cardName: null, accountId: 20, accountName: 'Banco' })],
  ...overrides
});
