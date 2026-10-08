import { DashboardPendingItem } from '../models/dashboard.model';
import { pendingAction, pendingIcon, pendingRoute } from './dashboard-pending.util';

function item(kind: DashboardPendingItem['kind']): DashboardPendingItem {
    return { kind, title: 'AL30', detail: null, amount: null, assetSymbol: null, date: null, linkId: null, severity: 'warning' };
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
});
