import { BondUpcomingMonth, BondUpcomingPayment, BondUpcomingReport } from '../models/investment-report.model';

// plan-amortizaciones-bonos, Fase 15: lógica pura de "Próximos cobros de bonos" — resumen por moneda y
// datos de los gráficos. Los montos del reporte están en la moneda en la que paga cada bono, así que
// nunca se suman entre monedas distintas.

export interface CurrencySummary {
    currency: string;
    // Lo que falta cobrar hasta el vencimiento de todos los bonos que pagan en esta moneda.
    total: number;
    capital: number;
    interest: number;
    // Algún pago de esta moneda es indexado (CER / dólar linked) y quedó afuera de los totales.
    hasIndexed: boolean;
    // Primer pago por delante (con o sin monto, si es indexado se muestra «a confirmar»).
    next: BondUpcomingPayment | null;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

export function summarizeByCurrency(report: BondUpcomingReport): CurrencySummary[] {
    const currencies = Array.from(new Set(report.bonds.map(b => b.currencySymbol))).sort();
    return currencies.map(currency => {
        const bonds = report.bonds.filter(b => b.currencySymbol === currency);
        const next = report.payments
            .filter(p => p.currencySymbol === currency)
            .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate))[0] ?? null;
        return {
            currency,
            total: round2(bonds.reduce((sum, b) => sum + b.total, 0)),
            capital: round2(bonds.reduce((sum, b) => sum + b.totalCapital, 0)),
            interest: round2(bonds.reduce((sum, b) => sum + b.totalInterest, 0)),
            hasIndexed: bonds.some(b => b.hasIndexedPayments),
            next,
        };
    });
}

// "2027-01-01T00:00:00" -> "ene 2027". Se arma desde el texto, sin pasar por la zona horaria.
export function monthLabel(iso: string): string {
    const [year, month] = iso.substring(0, 10).split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }).replace('.', '');
}

// Un mes por barra, capital e interés apilados, solo de la moneda pedida.
export function monthlyChartData(months: BondUpcomingMonth[], currency: string): { labels: string[]; capital: number[]; interest: number[] } {
    const own = months.filter(m => m.currencySymbol === currency).sort((a, b) => a.month.localeCompare(b.month));
    return {
        labels: own.map(m => monthLabel(m.month)),
        capital: own.map(m => m.capital),
        interest: own.map(m => m.interest),
    };
}
