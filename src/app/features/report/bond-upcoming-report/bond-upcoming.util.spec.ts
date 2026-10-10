import { BondUpcomingBond, BondUpcomingMonth, BondUpcomingPayment, BondUpcomingReport } from '../models/investment-report.model';
import { monthLabel, monthlyChartData, summarizeByCurrency } from './bond-upcoming.util';

function payment(date: string, symbol: string, currency: string, total: number | null): BondUpcomingPayment {
    return {
        paymentDate: `${date}T00:00:00`, assetId: 1, symbol, assetName: symbol, currencySymbol: currency, heldQuantity: 5,
        amortizationRate: 0.08, isIndexed: total === null, estimatedCapital: total, estimatedInterest: total === null ? null : 0, estimatedTotal: total,
        residualAfterPer100: 56,
    };
}

function bond(symbol: string, currency: string, capital: number, interest: number, hasIndexed = false): BondUpcomingBond {
    return {
        assetId: 1, symbol, assetName: symbol, currencySymbol: currency, heldQuantity: 5, residualPer100: 64, maturity: '2030-07-09T00:00:00',
        paymentCount: 8, totalCapital: capital, totalInterest: interest, total: capital + interest, hasIndexedPayments: hasIndexed,
    };
}

function month(date: string, currency: string, capital: number, interest: number): BondUpcomingMonth {
    return { month: `${date}T00:00:00`, currencySymbol: currency, capital, interest, total: capital + interest, paymentCount: 1, indexedPaymentCount: 0 };
}

describe('bond-upcoming.util', () => {
    it('summarizeByCurrency suma lo que falta cobrar por moneda, sin mezclar monedas', () => {
        const report: BondUpcomingReport = {
            payments: [], months: [],
            bonds: [bond('AL30', 'USD', 371.84, 11.15), bond('GD35', 'USD', 54, 17.63), bond('TX26', 'ARS', 0, 0, true)],
        };

        const summary = summarizeByCurrency(report);

        expect(summary.map(s => s.currency)).toEqual(['ARS', 'USD']);
        const usd = summary.find(s => s.currency === 'USD')!;
        expect(usd.capital).toBe(425.84);
        expect(usd.interest).toBe(28.78);
        expect(usd.total).toBe(454.62);
        expect(usd.hasIndexed).toBe(false);
        expect(summary.find(s => s.currency === 'ARS')!.hasIndexed).toBe(true);
    });

    it('el próximo cobro de cada moneda es su pago más cercano', () => {
        const report: BondUpcomingReport = {
            months: [], bonds: [bond('AL30', 'USD', 10, 1), bond('AN29', 'USD', 5, 1)],
            payments: [payment('2027-01-09', 'AL30', 'USD', 47.87), payment('2026-11-30', 'AN29', 'USD', 0.16)],
        };

        const next = summarizeByCurrency(report)[0].next!;

        expect(next.symbol).toBe('AN29');
        expect(next.paymentDate).toBe('2026-11-30T00:00:00');
    });

    it('un bono indexado como próximo pago se informa igual, sin monto', () => {
        const report: BondUpcomingReport = {
            months: [], bonds: [bond('TX26', 'ARS', 0, 0, true)], payments: [payment('2026-11-09', 'TX26', 'ARS', null)],
        };

        const next = summarizeByCurrency(report)[0].next!;

        expect(next.estimatedTotal).toBeNull();
    });

    it('sin bonos no hay nada para resumir', () => {
        expect(summarizeByCurrency({ payments: [], months: [], bonds: [] })).toEqual([]);
    });

    it('monthLabel arma "mes año" desde el texto, sin depender de la zona horaria', () => {
        expect(monthLabel('2027-01-01T00:00:00')).toContain('2027');
        expect(monthLabel('2027-01-01T00:00:00').toLowerCase()).toContain('ene');
        expect(monthLabel('2026-12-01T00:00:00').toLowerCase()).toContain('dic');
    });

    it('monthlyChartData ordena los meses y deja solo la moneda pedida', () => {
        const months = [month('2027-07-01', 'USD', 46.48, 2.33), month('2027-01-01', 'USD', 46.48, 2.5), month('2027-01-01', 'ARS', 0, 0)];

        const data = monthlyChartData(months, 'USD');

        expect(data.labels.length).toBe(2);
        expect(data.capital).toEqual([46.48, 46.48]);
        expect(data.interest).toEqual([2.5, 2.33]);   // enero antes que julio
    });
});
