import { DashboardPendingItem, DashboardPendingKind } from '../models/dashboard.model';

// Metadatos y ruteo de cada tipo de pendiente del `DashboardService` (Fase 16) — un único lugar
// para las dos pantallas que muestran la bandeja "Requiere tu atención"/"Lo que necesita atención"
// (Panorama, Fase 17, e Inicio, Fase 18), para que no diverjan.
const PENDING_META: Record<DashboardPendingKind, { icon: string; action: string }> = {
    CardDue: { icon: 'bi-credit-card', action: 'Pagar' },
    PendingReimbursement: { icon: 'bi-gift', action: 'Ver tarjeta' },
    OpenSharedEvent: { icon: 'bi-people', action: 'Ver evento' },
    TripWithoutRecentExpense: { icon: 'bi-airplane', action: 'Cargar gasto' },
};

export function pendingIcon(kind: DashboardPendingKind): string {
    return PENDING_META[kind].icon;
}

export function pendingAction(kind: DashboardPendingKind): string {
    return PENDING_META[kind].action;
}

// Cada tipo de pendiente resuelve a la pantalla donde se atiende (sección 5.3 del plan): tarjeta a
// pagar, reintegro de tarjeta y viaje tienen pantalla propia fuera de Reportes; el evento compartido
// vive en /shared-events/:id.
export function pendingRoute(item: DashboardPendingItem): string[] {
    switch (item.kind) {
        case 'CardDue': return ['/cardTransactions/pay'];
        case 'PendingReimbursement': return ['/report/cards-promotions'];
        case 'OpenSharedEvent': return ['/shared-events', String(item.linkId)];
        case 'TripWithoutRecentExpense': return ['/management/trips', String(item.linkId), 'detail'];
    }
}
