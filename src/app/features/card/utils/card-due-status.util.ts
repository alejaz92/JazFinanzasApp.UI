import { Card } from '../models/card.model';

export type CardDueStatus = 'ninguno' | 'informativo' | 'alerta' | 'vencido';

const ALERT_THRESHOLD_DAYS = 3;

function parseLocalDate(isoDate: string): Date {
    const [year, month, day] = isoDate.substring(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
}

function stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffInDays(a: Date, b: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((a.getTime() - b.getTime()) / msPerDay);
}

// Estado del aviso de vencimiento (Flujo 3 de la propuesta): solo tiene sentido en la ventana
// cierre -> vencimiento. Antes del cierre no hay resumen generado; pagado el período, el aviso desaparece.
export function getCardDueStatus(
    card: Pick<Card, 'nextClosingDate' | 'nextDueDate' | 'isCurrentPeriodPaid'>,
    today: Date = new Date()
): CardDueStatus {
    if (!card.nextClosingDate || !card.nextDueDate) return 'ninguno';
    if (card.isCurrentPeriodPaid) return 'ninguno';

    const closing = parseLocalDate(card.nextClosingDate);
    const due = parseLocalDate(card.nextDueDate);
    const todayLocal = stripTime(today);

    if (todayLocal < closing) return 'ninguno';
    if (todayLocal > due) return 'vencido';

    const daysUntilDue = diffInDays(due, todayLocal);
    return daysUntilDue <= ALERT_THRESHOLD_DAYS ? 'alerta' : 'informativo';
}
