import { ContributionsVsPerformance } from '../models/investment-report.model';
import { buildWaterfallSteps, priceValuation, WaterfallPalette } from './contributions-waterfall.util';

const palette: WaterfallPalette = { total: 'total', good: 'good', critical: 'critical' };

function data(overrides: Partial<ContributionsVsPerformance>): ContributionsVsPerformance {
    return {
        referenceAssetSymbol: 'USD', startMonth: '2024-03-01',
        initialValue: 1000, contributed: 500, withdrawn: 100, valuation: 100, interestCollected: 0, finalValue: 1500,
        ...overrides,
    };
}

// inicial + aportes + retiros(con signo) + valorización + intereses = final
function cascadeTotal(steps: ReturnType<typeof buildWaterfallSteps>): number {
    return steps
        .filter(s => s.name !== 'Valor final')
        .reduce((sum, s) => sum + s.displayValue, 0);
}

describe('contributions-waterfall.util', () => {
    it('sin intereses cobrados la cascada es la de siempre, sin barra de intereses', () => {
        const steps = buildWaterfallSteps(data({}), palette);

        expect(steps.map(s => s.name)).toEqual(['Valor inicial', 'Aportes', 'Retiros', 'Valorización', 'Valor final']);
        expect(steps[3].displayValue).toBe(100);
        expect(cascadeTotal(steps)).toBe(1500);
    });

    it('con intereses, la valorización muestra solo el efecto precio y los intereses van en su barra', () => {
        // Un bono que valía 1.000, devolvió 100 de capital, pagó 20 de interés y subió 50: vale 950.
        const d = data({ initialValue: 1000, contributed: 0, withdrawn: 120, valuation: 70, interestCollected: 20, finalValue: 950 });

        const steps = buildWaterfallSteps(d, palette);

        expect(steps.map(s => s.name)).toEqual(['Valor inicial', 'Aportes', 'Retiros', 'Valorización', 'Intereses cobrados', 'Valor final']);
        expect(steps.find(s => s.name === 'Retiros')!.displayValue).toBe(-120);
        expect(steps.find(s => s.name === 'Valorización')!.displayValue).toBe(50);
        expect(steps.find(s => s.name === 'Intereses cobrados')!.displayValue).toBe(20);
        expect(cascadeTotal(steps)).toBe(950); // la cascada cierra en el valor final
    });

    it('la barra de intereses va entre la valorización y el valor final, y es positiva', () => {
        const steps = buildWaterfallSteps(data({ withdrawn: 125, valuation: 125, interestCollected: 5 }), palette);

        const names = steps.map(s => s.name);
        expect(names.indexOf('Intereses cobrados')).toBe(names.indexOf('Valorización') + 1);
        expect(names.indexOf('Valor final')).toBe(names.indexOf('Intereses cobrados') + 1);
        expect(steps.find(s => s.name === 'Intereses cobrados')!.color).toBe('good');
    });

    it('una valorización de precio negativa se pinta como pérdida', () => {
        const steps = buildWaterfallSteps(data({ valuation: 10, interestCollected: 30, withdrawn: 130, finalValue: 1380 }), palette);

        const valuation = steps.find(s => s.name === 'Valorización')!;
        expect(valuation.displayValue).toBe(-20);
        expect(valuation.color).toBe('critical');
        expect(valuation.delta).toBe(20);
    });

    it('priceValuation no arrastra ruido de punto flotante', () => {
        expect(priceValuation(data({ valuation: 0.3, interestCollected: 0.1 }))).toBe(0.2);
    });
});
