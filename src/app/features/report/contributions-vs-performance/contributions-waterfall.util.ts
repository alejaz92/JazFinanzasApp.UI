import { ContributionsVsPerformance } from '../models/investment-report.model';

export interface WaterfallStep {
    name: string;
    base: number;
    delta: number;
    color: string;
    displayValue: number;
}

export interface WaterfallPalette {
    total: string;
    good: string;
    critical: string;
}

// plan-amortizaciones-bonos, Fase 11 (T12): `valuation` del backend incluye los intereses cobrados de
// bonos, así que la valorización "pura" de precio es valuation - interestCollected. Redondeado a 2
// decimales para no arrastrar ruido de punto flotante (ambos vienen redondeados a 2 del backend).
export function priceValuation(data: ContributionsVsPerformance): number {
    return Math.round((data.valuation - (data.interestCollected ?? 0)) * 100) / 100;
}

// Cascada Valor inicial → Aportes → Retiros → Valorización → [Intereses cobrados] → Valor final.
// La barra de intereses solo aparece si hubo intereses cobrados: sin bonos con cobros la cascada es
// exactamente la de siempre. Pura — testeable sin DOM ni ECharts.
export function buildWaterfallSteps(data: ContributionsVsPerformance, palette: WaterfallPalette): WaterfallStep[] {
    const steps: WaterfallStep[] = [];

    steps.push({ name: 'Valor inicial', base: 0, delta: data.initialValue, color: palette.total, displayValue: data.initialValue });
    let cum = data.initialValue;

    const afterContributions = cum + data.contributed;
    steps.push({ name: 'Aportes', base: Math.min(cum, afterContributions), delta: data.contributed, color: palette.good, displayValue: data.contributed });
    cum = afterContributions;

    const afterWithdrawals = cum - data.withdrawn;
    steps.push({ name: 'Retiros', base: Math.min(cum, afterWithdrawals), delta: data.withdrawn, color: palette.critical, displayValue: -data.withdrawn });
    cum = afterWithdrawals;

    const valuation = priceValuation(data);
    const afterValuation = cum + valuation;
    steps.push({
        name: 'Valorización', base: Math.min(cum, afterValuation), delta: Math.abs(valuation),
        color: valuation >= 0 ? palette.good : palette.critical, displayValue: valuation,
    });
    cum = afterValuation;

    const interest = data.interestCollected ?? 0;
    if (interest !== 0) {
        const afterInterest = cum + interest;
        steps.push({
            name: 'Intereses cobrados', base: Math.min(cum, afterInterest), delta: Math.abs(interest),
            color: interest >= 0 ? palette.good : palette.critical, displayValue: interest,
        });
        cum = afterInterest;
    }

    steps.push({ name: 'Valor final', base: 0, delta: data.finalValue, color: palette.total, displayValue: data.finalValue });

    return steps;
}
