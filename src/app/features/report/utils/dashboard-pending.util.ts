import { DashboardPendingItem, DashboardPendingKind, DashboardPendingSeverity } from '../models/dashboard.model';

// Metadatos y ruteo de cada tipo de pendiente del `DashboardService` (Fase 16) — un único lugar
// para las dos pantallas que muestran la bandeja "Requiere tu atención"/"Lo que necesita atención"
// (Panorama, Fase 17, e Inicio, Fase 18), para que no diverjan.
//
// plan-alerta-cotizaciones, Fase 1: 'StaleQuote' no tiene acción — es informativo, no hay pantalla
// adonde mandar a "resolverlo". `action: ''` hace que el badge no se muestre (ver pendingRoute).
const PENDING_META: Record<DashboardPendingKind, { icon: string; action: string }> = {
    CardDue: { icon: 'bi-credit-card', action: 'Pagar' },
    OpenSharedEvent: { icon: 'bi-people', action: 'Ver evento' },
    PersonDebt: { icon: 'bi-person', action: 'Ver deuda' },
    TripWithoutRecentExpense: { icon: 'bi-airplane', action: 'Cargar gasto' },
    StaleQuote: { icon: 'bi-graph-down-arrow', action: '' },
};

// Ícono/acción por default para un `kind` que el frontend todavía no conoce — evita que la bandeja
// entera deje de dibujarse si el backend empieza a mandar un tipo nuevo antes de que el frontend
// correspondiente esté deployado (plan-alerta-cotizaciones, T7: acá se deploya primero el frontend,
// pero esto además cubre el caso general para cualquier tipo futuro).
const UNKNOWN_META = { icon: 'bi-info-circle', action: '' };

export function pendingIcon(kind: DashboardPendingKind): string {
    return (PENDING_META[kind] ?? UNKNOWN_META).icon;
}

export function pendingAction(kind: DashboardPendingKind): string {
    return (PENDING_META[kind] ?? UNKNOWN_META).action;
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

// Cada tipo de pendiente resuelve a la pantalla donde se atiende (sección 5.3 del plan): tarjeta a
// pagar y viaje tienen pantalla propia fuera de Reportes; el evento compartido vive en
// /shared-events/:id. PersonDebt (gastos sueltos, sin Evento) no tiene una pantalla por persona —
// /shared-expenses es la misma para las tres personas de la bandeja, igual que ya hacía el
// HomeComponent viejo con "Ver detalle de gastos compartidos".
//
// `null` (StaleQuote, o cualquier `kind` que este frontend todavía no conoce) significa "no hay
// adonde ir": la fila se dibuja sin link ni badge de acción (ver los templates de Inicio y Panorama).
export function pendingRoute(item: DashboardPendingItem): string[] | null {
    switch (item.kind) {
        case 'CardDue': return ['/cardTransactions/pay'];
        case 'OpenSharedEvent': return ['/shared-events', String(item.linkId)];
        case 'PersonDebt': return ['/shared-expenses'];
        case 'TripWithoutRecentExpense': return ['/management/trips', String(item.linkId), 'detail'];
        case 'StaleQuote': return null;
        default: return null;
    }
}
