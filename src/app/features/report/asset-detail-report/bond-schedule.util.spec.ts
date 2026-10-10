import { BondPaymentScheduleItem } from '../models/investment-report.model';
import {
    formatAmortizationPercent, formatPaymentDate, paymentCaption, paymentMarkerLabel, paymentsInRange, statusClass, statusLabel
} from './bond-schedule.util';

function payment(date: string, amortizationRate: number, residualAfterPer100: number): BondPaymentScheduleItem {
    return {
        paymentDate: `${date}T00:00:00`, interestPer100: 0.27, amortizationRate, residualAfterPer100,
        isIndexed: false, status: 'Registered', collectedCapital: 0, collectedInterest: 0,
    };
}

describe('bond-schedule.util', () => {
    it('formatPaymentDate da dd/MM/yyyy con ceros, sin depender de la zona horaria', () => {
        expect(formatPaymentDate('2026-07-09T00:00:00')).toBe('09/07/2026');
        expect(formatPaymentDate('2026-01-09')).toBe('09/01/2026');
    });

    it('formatAmortizationPercent muestra el porcentaje sin ceros de más', () => {
        expect(formatAmortizationPercent(0.08)).toBe('8');
        expect(formatAmortizationPercent(0.3333)).toBe('33,33');
        expect(formatAmortizationPercent(0.04)).toBe('4');
    });

    it('la leyenda de un pago que amortiza sigue el ejemplo del plan: "09/07/2026 — amortizó 8%"', () => {
        const caption = paymentCaption(payment('2026-07-09', 0.08, 64));

        expect(caption.startsWith('09/07/2026 — amortizó 8%')).toBe(true);
        expect(caption).toContain('capital vivo después: 64 de cada 100');
    });

    it('un pago que no devuelve capital se rotula como cupón', () => {
        const coupon = payment('2026-05-30', 0, 100);

        expect(paymentCaption(coupon)).toContain('pagó cupón');
        expect(paymentMarkerLabel(coupon)).toBe('Cupón');
        expect(paymentMarkerLabel(payment('2026-07-09', 0.08, 64))).toBe('Amortiza 8%');
    });

    it('paymentsInRange deja solo los pagos dentro de la ventana de la curva', () => {
        const schedule = [payment('2025-07-09', 0.08, 80), payment('2026-01-09', 0.08, 72), payment('2026-07-09', 0.08, 64), payment('2027-01-09', 0.08, 56)];
        const from = new Date('2025-10-10T00:00:00').getTime();
        const to = new Date('2026-10-10T00:00:00').getTime();

        const inRange = paymentsInRange(schedule, from, to);

        expect(inRange.map(p => p.residualAfterPer100)).toEqual([72, 64]);
    });

    it('paymentsInRange no marca nada si la curva no tiene datos', () => {
        expect(paymentsInRange([payment('2026-07-09', 0.08, 64)], null, null)).toEqual([]);
    });

    it('cada estado tiene su rótulo y su color', () => {
        expect(statusLabel('Registered')).toBe('Cobrado');
        expect(statusLabel('Pending')).toBe('Pendiente de registrar');
        expect(statusLabel('Future')).toBe('Próximo');
        expect(statusLabel('NotHeld')).toBe('No lo tenías');
        expect(statusClass('Pending')).toBe('bg-danger');
        expect(statusClass('Registered')).toBe('bg-success');
    });
});
