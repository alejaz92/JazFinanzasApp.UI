import { DashboardPendingItem } from '../models/dashboard.model';
import { pendingAction, pendingIcon, pendingRoute, pendingSeverityBadgeClass, pendingSummary } from './dashboard-pending.util';

function item(kind: DashboardPendingItem['kind']): DashboardPendingItem {
    return { kind, title: 'AL30', detail: null, amount: null, assetSymbol: null, date: null, linkId: null, findingId: null, severity: 'warning' };
}

describe('dashboard-pending.util', () => {
    it('BondCollection se atiende en Cobros de Bonos, con acción "Registrar"', () => {
        expect(pendingRoute(item('BondCollection'))).toEqual(['/stockTransactions/bond-collections']);
        expect(pendingAction('BondCollection')).toBe('Registrar');
        expect(pendingIcon('BondCollection')).toBe('bi-cash-coin');
    });

    it('un kind que el frontend no conoce no rompe: ícono genérico, sin acción ni ruta', () => {
        const unknown = 'AlgoNuevo' as DashboardPendingItem['kind'];
        expect(pendingIcon(unknown)).toBe('bi-info-circle');
        expect(pendingAction(unknown)).toBe('');
        expect(pendingRoute(item(unknown))).toBeNull();
    });

    // plan-repartos-y-descuentos-faltantes.md, Fase 8
    it('el aviso de compras que no cierran lleva a su pantalla, con acción "Revisar"', () => {
        expect(pendingRoute(item('CardPurchaseMismatch'))).toEqual(['/cardTransactions/mismatches']);
        expect(pendingAction('CardPurchaseMismatch')).toBe('Revisar');
        expect(pendingIcon('CardPurchaseMismatch')).toBe('bi-calculator');
    });

    // plan-gastos-recurrentes.md, Fase 9
    it('el aviso de un fijo sin pagar lleva a su ficha, con acción "Ver ficha"', () => {
        expect(pendingRoute({ ...item('RecurringExpenseMissing'), linkId: 7 })).toEqual(['/recurring-expenses', '7']);
        expect(pendingAction('RecurringExpenseMissing')).toBe('Ver ficha');
        expect(pendingIcon('RecurringExpenseMissing')).toBe('bi-calendar-x');
    });

    it('StaleQuote sigue sin ruta (informativo)', () => {
        expect(pendingRoute(item('StaleQuote'))).toBeNull();
    });

    // plan-devoluciones-llm, Fase 12
    it('las alertas por categoría llevan al reporte por categoría y la de ingresos al de ingresos', () => {
        expect(pendingRoute(item('CategorySpike'))).toEqual(['/report/inc-exp-by-category']);
        expect(pendingRoute(item('LargeMovement'))).toEqual(['/report/inc-exp-by-category']);
        expect(pendingRoute(item('MissingIncome'))).toEqual(['/report/inc-income']);
        expect(pendingAction('CategorySpike')).toBe('Ver categorías');
        expect(pendingAction('MissingIncome')).toBe('Ver ingresos');
    });

    it('el hallazgo del asistente y el aviso de revisión no tienen ruta ni acción, pero sí ícono propio', () => {
        for (const kind of ['AssistantFinding', 'AssistantQualityReviewDue'] as const) {
            expect(pendingRoute(item(kind))).toBeNull();
            expect(pendingAction(kind)).toBe('');
            expect(pendingIcon(kind)).not.toBe('bi-info-circle');
        }
    });

    it('cada tipo nuevo tiene un ícono distinto del genérico', () => {
        for (const kind of ['CategorySpike', 'LargeMovement', 'MissingIncome'] as const) {
            expect(pendingIcon(kind)).not.toBe('bi-info-circle');
        }
    });

    // plan-inicio-rapido.md, Fase 5 (D9): el encabezado de la bandeja plegada.
    describe('pendingSummary', () => {
        const withSeverity = (severity: DashboardPendingItem['severity']): DashboardPendingItem => ({ ...item('CardDue'), severity });

        it('sin avisos: cantidad 0 y sin gravedad', () => {
            expect(pendingSummary([])).toEqual({ count: 0, severity: null });
        });

        it('cuenta los avisos y se queda con la gravedad más alta (danger > warning > info)', () => {
            expect(pendingSummary([withSeverity('info'), withSeverity('info')])).toEqual({ count: 2, severity: 'info' });
            expect(pendingSummary([withSeverity('info'), withSeverity('warning')])).toEqual({ count: 2, severity: 'warning' });
            expect(pendingSummary([withSeverity('warning'), withSeverity('danger'), withSeverity('info')])).toEqual({ count: 3, severity: 'danger' });
        });

        it('el color del contador sigue a la gravedad, y sin gravedad queda neutro', () => {
            expect(pendingSeverityBadgeClass('danger')).toBe('bg-danger');
            expect(pendingSeverityBadgeClass('warning')).toBe('bg-warning text-dark');
            expect(pendingSeverityBadgeClass('info')).toBe('bg-primary');
            expect(pendingSeverityBadgeClass(null)).toBe('bg-secondary');
        });
    });
});
