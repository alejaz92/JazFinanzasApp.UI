import { DashboardPendingItem } from '../models/dashboard.model';
import { pendingAction, pendingIcon, pendingRoute } from './dashboard-pending.util';

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
});
