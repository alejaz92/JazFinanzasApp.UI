import { BondPaymentScheduleItem, BondScheduleStatus } from '../models/investment-report.model';

// plan-amortizaciones-bonos, Fase 13: lógica pura del cronograma de pagos de un bono en su detalle —
// qué pagos se marcan sobre la curva de cotización y cómo se rotulan.

// dd/MM/yyyy tomado del texto ISO ("2026-07-09T00:00:00"), sin pasar por Date: así no depende de la
// zona horaria ni del locale.
export function formatPaymentDate(iso: string): string {
    const [year, month, day] = iso.substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
}

// 0.08 -> "8"; 0.3333 -> "33,33".
export function formatAmortizationPercent(rate: number): string {
    return (rate * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

// Pagos que caen dentro de la ventana de la curva de cotización (12 meses). Fuera de ella no se
// marcan: un marcador fuera de rango no tiene curva sobre la que apoyarse.
export function paymentsInRange(schedule: BondPaymentScheduleItem[], fromMs: number | null, toMs: number | null): BondPaymentScheduleItem[] {
    if (fromMs == null || toMs == null) return [];
    return schedule.filter(p => {
        const t = new Date(p.paymentDate).getTime();
        return t >= fromMs && t <= toMs;
    });
}

// Leyenda de un pago bajo el gráfico: "09/07/2026 — amortizó 8%" (o "pagó cupón" si ese pago no
// devolvió capital), con el capital que le queda al bono después.
export function paymentCaption(p: BondPaymentScheduleItem): string {
    const what = p.amortizationRate > 0 ? `amortizó ${formatAmortizationPercent(p.amortizationRate)}%` : 'pagó cupón';
    return `${formatPaymentDate(p.paymentDate)} — ${what} (capital vivo después: ${p.residualAfterPer100.toLocaleString('es-AR', { maximumFractionDigits: 2 })} de cada 100)`;
}

// Rótulo corto sobre la línea vertical del gráfico.
export function paymentMarkerLabel(p: BondPaymentScheduleItem): string {
    return p.amortizationRate > 0 ? `Amortiza ${formatAmortizationPercent(p.amortizationRate)}%` : 'Cupón';
}

export function statusLabel(status: BondScheduleStatus): string {
    switch (status) {
        case 'Registered': return 'Cobrado';
        case 'Untracked': return 'Cobrado, sin movimiento';
        case 'Dismissed': return 'No cobrado';
        case 'Pending': return 'Pendiente de registrar';
        case 'Future': return 'Próximo';
        case 'NotHeld': return 'No lo tenías';
        default: return status;
    }
}

export function statusClass(status: BondScheduleStatus): string {
    switch (status) {
        case 'Registered': return 'bg-success';
        case 'Untracked': return 'bg-secondary';
        case 'Dismissed': return 'bg-warning text-dark';
        case 'Pending': return 'bg-danger';
        case 'Future': return 'bg-light text-dark border';
        case 'NotHeld': return 'bg-light text-body-secondary border';
        default: return 'bg-secondary';
    }
}
