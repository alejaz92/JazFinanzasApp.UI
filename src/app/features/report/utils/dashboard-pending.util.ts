import { DashboardPendingItem, DashboardPendingKind, DashboardPendingSeverity } from '../models/dashboard.model';

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

// Color del badge/ícono según urgencia (`Severity` del backend, Fase 16 corrección): una tarjeta ya
// vencida se distingue de una que solo vence pronto, mismo criterio que la pantalla vieja de Inicio
// (alert-danger/alert-warning) — el resto de los tipos no tiene grados, quedan en "info".
const SEVERITY_CLASS: Record<DashboardPendingSeverity, string> = {
    info: 'bg-primary',
    warning: 'bg-warning text-dark',
    danger: 'bg-danger',
};

export function pendingBadgeClass(item: DashboardPendingItem): string {
    return SEVERITY_CLASS[item.severity];
}

const SEVERITY_ICON_CLASS: Record<DashboardPendingSeverity, string> = {
    info: '',
    warning: 'text-warning',
    danger: 'text-danger',
};

export function pendingIconClass(item: DashboardPendingItem): string {
    return SEVERITY_ICON_CLASS[item.severity];
}

// El título de un `PendingReimbursement` es la descripción de la COMPRA que generó el reintegro
// (`CardTransaction.Detail` en el backend), no el nombre de una promoción — mostrarlo solo ("Comida
// Post Tenis") se leía como si el gasto en sí necesitara atención. Se antepone la palabra que falta.
export function pendingLabel(item: DashboardPendingItem): string {
    return item.kind === 'PendingReimbursement' ? `Reintegro pendiente — ${item.title}` : item.title;
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
