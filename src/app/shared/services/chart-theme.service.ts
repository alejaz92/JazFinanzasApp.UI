import { Injectable } from '@angular/core';
import { CurrencyFiatFormatPipe } from '../pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../pipes/currencyInvestmentFormat/currency-investment-format.pipe';

export interface SemanticColors {
    income: string;
    expense: string;
    gain: string;
    loss: string;
}

// Paleta fija de series (T3, docs/plans/activos/plan-rediseno-reportes.md): mismo
// índice, mismo color, siempre, en ambos temas — reemplaza a generateControlledColors(),
// que usaba Math.random() y hacía que los gráficos cambiaran de color en cada recarga.
// Ancla en el violeta de marca ($jf-violet) y suma acentos distinguibles entre sí.
const SERIES_PALETTE: readonly string[] = [
    '#5B3DD9', // jf-violet (primary)
    '#2FB6B2', // teal
    '#F2994A', // naranja
    '#3D8BD9', // azul
    '#8B72E8', // jf-violet-light
    '#4CAF7D', // verde
    '#C74FA0', // magenta
    '#D9B23D', // ámbar
    '#6B4FD0', // violeta oscuro
    '#EA5B5B', // rojo
];

@Injectable({ providedIn: 'root' })
export class ChartThemeService {
    private readonly currencyFiatPipe = new CurrencyFiatFormatPipe();
    private readonly currencyInvestmentPipe = new CurrencyInvestmentFormatPipe();

    // Color de serie determinista por índice — usar en vez de generar colores al azar.
    colorAt(index: number): string {
        return SERIES_PALETTE[index % SERIES_PALETTE.length];
    }

    colors(count: number): string[] {
        return Array.from({ length: count }, (_, i) => this.colorAt(i));
    }

    // Ingreso/egreso, ganancia/pérdida: reusa las variables success/danger de Bootstrap
    // (mismas que ya usan las tablas de reportes vía text-success/text-danger) en vez de
    // definir hex propios — así siguen automáticamente cualquier ajuste de esos colores
    // y ya vienen correctos para modo claro y oscuro.
    get semantic(): SemanticColors {
        const cs = getComputedStyle(document.documentElement);
        const success = cs.getPropertyValue('--bs-success').trim() || '#198754';
        const danger = cs.getPropertyValue('--bs-danger').trim() || '#dc3545';
        return { income: success, expense: danger, gain: success, loss: danger };
    }

    formatCurrency(value: number): string {
        return this.currencyFiatPipe.transform(value);
    }

    formatInvestment(value: number): string {
        return this.currencyInvestmentPipe.transform(value);
    }

    // Getters live (no cacheados) sobre las custom properties de Bootstrap vigentes en
    // <html> — para series con opciones puntuales (ej. el texto central de un gauge) que
    // necesitan un color explícito legible en ambos temas y no lo heredan del theme general.
    get textColor(): string {
        return getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color').trim() || '#332E4D';
    }

    get borderColor(): string {
        return getComputedStyle(document.documentElement).getPropertyValue('--bs-border-color').trim() || '#dee2e6';
    }

    get surfaceColor(): string {
        return getComputedStyle(document.documentElement).getPropertyValue('--bs-secondary-bg').trim() || '#ffffff';
    }

    // Objeto de tema para echarts.init(dom, theme): se recalcula cada vez que se pide,
    // leyendo las custom properties de Bootstrap vigentes en <html> — así sigue
    // automáticamente cualquier cambio de paleta en styles.scss (incluido el toggle de
    // modo claro/oscuro) sin duplicar valores hexadecimales acá.
    buildEChartsTheme(): Record<string, unknown> {
        const textColor = this.textColor;
        const borderColor = this.borderColor;
        const surfaceColor = this.surfaceColor;
        const fontFamily = "'Inter', system-ui, -apple-system, sans-serif";

        const axisCommon = {
            axisLine: { lineStyle: { color: borderColor } },
            axisTick: { lineStyle: { color: borderColor } },
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: borderColor } },
        };

        return {
            color: [...SERIES_PALETTE],
            backgroundColor: 'transparent',
            textStyle: { color: textColor, fontFamily },
            title: { textStyle: { color: textColor } },
            legend: { textStyle: { color: textColor } },
            categoryAxis: axisCommon,
            valueAxis: axisCommon,
            tooltip: {
                backgroundColor: surfaceColor,
                borderColor,
                textStyle: { color: textColor },
            },
        };
    }
}
