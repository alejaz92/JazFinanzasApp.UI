import { getCardDueStatus } from './card-due-status.util';

describe('getCardDueStatus', () => {
  const today = new Date(2026, 8, 20); // 20/09/2026

  it('should return "ninguno" when there is no nextClosingDate or nextDueDate', () => {
    expect(getCardDueStatus({ nextClosingDate: null, nextDueDate: null, isCurrentPeriodPaid: false }, today)).toBe('ninguno');
    expect(getCardDueStatus({ nextClosingDate: '2026-09-20', nextDueDate: null, isCurrentPeriodPaid: false }, today)).toBe('ninguno');
  });

  it('should return "ninguno" when the current period is already paid', () => {
    expect(getCardDueStatus({ nextClosingDate: '2026-09-10', nextDueDate: '2026-09-17', isCurrentPeriodPaid: true }, today)).toBe('ninguno');
  });

  it('should return "ninguno" before the closing date (nothing to pay yet)', () => {
    expect(getCardDueStatus({ nextClosingDate: '2026-09-25', nextDueDate: '2026-10-02', isCurrentPeriodPaid: false }, today)).toBe('ninguno');
  });

  it('should return "informativo" right after closing, far from the due date', () => {
    expect(getCardDueStatus({ nextClosingDate: '2026-09-18', nextDueDate: '2026-09-30', isCurrentPeriodPaid: false }, today)).toBe('informativo');
  });

  it('should return "alerta" within the last 3 days before the due date (inclusive)', () => {
    expect(getCardDueStatus({ nextClosingDate: '2026-09-10', nextDueDate: '2026-09-23', isCurrentPeriodPaid: false }, today)).toBe('alerta');
    expect(getCardDueStatus({ nextClosingDate: '2026-09-10', nextDueDate: '2026-09-20', isCurrentPeriodPaid: false }, today)).toBe('alerta');
  });

  it('should return "vencido" after the due date without a payment registered', () => {
    expect(getCardDueStatus({ nextClosingDate: '2026-09-01', nextDueDate: '2026-09-19', isCurrentPeriodPaid: false }, today)).toBe('vencido');
  });
});
