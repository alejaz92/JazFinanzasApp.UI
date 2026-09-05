import { Injectable, inject } from '@angular/core';
import type { EChartsOption } from 'echarts';
import { ThemeService } from '../../core/services/theme.service';

/**
 * Paleta categórica validada (8 hues, orden fijo) — ver docs/plans/guias
 * y la skill de dataviz: pasa las seis verificaciones (banda de luminosidad,
 * piso de croma, separación CVD adyacente y de visión normal, contraste)
 * en claro y oscuro, y los primeros 3 slots pasan también all-pairs en los
 * dos modos (necesario para dispersión/burbujas). No reordenar sin re-validar
 * con scripts/validate_palette.js de esa skill.
 */
const CATEGORICAL_LIGHT: readonly string[] = [
  '#2a78d6', // 1 azul
  '#eb6834', // 2 naranja
  '#1baf7a', // 3 aqua
  '#eda100', // 4 amarillo
  '#e87ba4', // 5 magenta
  '#008300', // 6 verde
  '#4a3aa7', // 7 violeta — misma familia que el primary de la marca (#5B3DD9)
  '#e34948', // 8 rojo
];

const CATEGORICAL_DARK: readonly string[] = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9', // violeta oscuro — misma familia que el acento de la marca en oscuro (#8B72E8)
  '#e66767',
];

/** Estado fijo, nunca reusado como color de serie — mismo valor en los dos modos. */
export const CHART_STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const;

export interface ChartSurfaceTokens {
  axisLabel: string;
  axisLine: string;
  splitLine: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
}

const SURFACE_LIGHT: ChartSurfaceTokens = {
  axisLabel: '#332E4D',
  axisLine: '#D8D4EE',
  splitLine: '#EDEBF9',
  tooltipBg: '#FFFFFF',
  tooltipBorder: '#D8D4EE',
  tooltipText: '#332E4D',
};

const SURFACE_DARK: ChartSurfaceTokens = {
  axisLabel: '#E4E1F2',
  axisLine: '#3D3660',
  splitLine: '#312B52',
  tooltipBg: '#26213F',
  tooltipBorder: '#3D3660',
  tooltipText: '#E4E1F2',
};

/**
 * Punto único de acceso a color, formato y tooltip de los gráficos de la app.
 * Reemplaza los `generateControlledColors()` sueltos (color aleatorio en cada
 * recarga) por una paleta fija: mismo índice, mismo color, siempre.
 */
@Injectable({ providedIn: 'root' })
export class ChartThemeService {
  private readonly theme = inject(ThemeService);

  private get mode(): 'light' | 'dark' {
    return this.theme.isDark ? 'dark' : 'light';
  }

  /** Paleta categórica completa del modo actual, en orden fijo. */
  get palette(): readonly string[] {
    return this.mode === 'dark' ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
  }

  /**
   * Color determinista para el índice `i`: siempre el mismo color para el
   * mismo índice, nunca `undefined` ni depende de cuántos elementos haya en
   * total. Los primeros 8 índices son la paleta validada tal cual (contraste,
   * CVD); a partir de ahí ya no repite el mismo color exacto (corrección
   * 2026-09-05: un reporte con 10 categorías —"Compromiso futuro"— mostraba
   * dos pares de colores idénticos e ilegibles en la leyenda) — reusa la misma
   * familia de hue pero con la luminosidad corrida, alternando más clara/más
   * oscura y agrandando el corrimiento en cada vuelta.
   */
  colorAt(i: number): string {
    const palette = this.palette;
    const n = palette.length;
    const baseIndex = ((i % n) + n) % n;
    const cycle = Math.floor(i / n);
    const base = palette[baseIndex];
    return cycle === 0 ? base : this.shiftLightness(base, cycle);
  }

  private shiftLightness(hex: string, cycle: number): string {
    const { h, s, l } = this.hexToHsl(hex);
    const magnitude = (Math.floor((Math.abs(cycle) - 1) / 2) + 1) * 20;
    const direction = Math.abs(cycle) % 2 === 1 ? 1 : -1;
    const newL = Math.min(85, Math.max(15, l + direction * magnitude));
    return this.hslToHex(h, s, newL);
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /** Colores de estado fijos (good/warning/serious/critical) — no siguen el tema. */
  get status(): typeof CHART_STATUS {
    return CHART_STATUS;
  }

  /** Tokens de superficie (ejes, grillas, tooltip) del modo actual. */
  get surface(): ChartSurfaceTokens {
    return this.mode === 'dark' ? SURFACE_DARK : SURFACE_LIGHT;
  }

  /** Formato numérico consistente con `currencyFiatFormat`/`currencyInvestmentFormat`. */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat('es-AR', options).format(value);
  }

  /** Opciones comunes de `tooltip` de ECharts, sobre los tokens de superficie del modo actual. */
  tooltipDefaults(): Record<string, unknown> {
    const s = this.surface;
    return {
      backgroundColor: s.tooltipBg,
      borderColor: s.tooltipBorder,
      textStyle: { color: s.tooltipText },
    };
  }

  /**
   * Torta/dona de composición: mismo patrón repetido en varios reportes
   * (distribución de bolsa, cripto, carteras, viajes) — nombre, valor
   * formateado y porcentaje en el tooltip; etiqueta solo si supera el
   * umbral, para no amontonar texto en las porciones chicas.
   */
  pieOptions(
    labels: string[],
    values: number[],
    opts?: {
      formatValue?: (v: number) => string;
      /** Nombre a mostrar en el tooltip cuando la etiqueta de la porción (ej. el ticker) no alcanza — ej. "Nombre completo (TICKER)". */
      formatTooltipName?: (label: string, index: number) => string;
      title?: string;
      labelThresholdPct?: number;
      donut?: boolean;
      /** Leyenda real abajo — para cuando las porciones ya tienen pocos elementos y nombres cortos (ej. carteras). */
      showLegend?: boolean;
    }
  ): EChartsOption {
    const formatValue = opts?.formatValue ?? ((v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v));
    const formatTooltipName = opts?.formatTooltipName ?? ((label: string) => label);
    const threshold = opts?.labelThresholdPct ?? 5;
    const axisLabel = this.surface.axisLabel;

    return {
      color: labels.map((_, i) => this.colorAt(i)),
      ...(opts?.title ? { title: { text: opts.title, left: 'center', textStyle: { color: axisLabel, fontSize: 14 } } } : {}),
      ...(opts?.showLegend ? { legend: { bottom: 0, textStyle: { color: axisLabel } } } : {}),
      tooltip: {
        trigger: 'item',
        ...this.tooltipDefaults(),
        formatter: (p: any) => `${formatTooltipName(p.name, p.dataIndex)}: ${formatValue(p.value)} (${p.percent}%)`,
      },
      series: [{
        type: 'pie',
        radius: opts?.donut ? ['45%', '70%'] : '70%',
        top: opts?.title ? 20 : 0,
        bottom: opts?.showLegend ? 30 : 0,
        data: labels.map((name, i) => ({ name, value: values[i] })),
        label: {
          show: true,
          color: '#fff',
          fontWeight: 'bold',
          formatter: (p: any) => (p.percent > threshold ? p.name : ''),
        },
        labelLine: { show: false },
        emphasis: { scaleSize: 6 },
      }],
    };
  }

  /**
   * Línea de evolución de un solo valor en el tiempo (precio, valor de
   * cartera/tenencia): área rellena, sin marcadores, eje X salteando
   * etiquetas cuando hay muchos puntos. Mismo patrón repetido en varios
   * reportes de inversión.
   */
  lineOptions(
    labels: string[],
    values: number[],
    opts?: { formatValue?: (v: number) => string; colorIndex?: number; smooth?: boolean; skipLabels?: boolean }
  ): EChartsOption {
    const formatValue = opts?.formatValue ?? ((v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v));
    const axisLabel = this.surface.axisLabel;

    return {
      color: [this.colorAt(opts?.colorIndex ?? 6)],
      grid: { left: 70, right: 20, top: 20, bottom: 40 },
      tooltip: { trigger: 'axis', ...this.tooltipDefaults(), valueFormatter: (v: unknown) => formatValue(Number(v)) },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: false,
        axisLabel: { color: axisLabel, interval: opts?.skipLabels === false ? 0 : 1 },
        axisLine: { lineStyle: { color: this.surface.axisLine } },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { color: axisLabel, formatter: (v: number) => formatValue(v) },
        splitLine: { lineStyle: { color: this.surface.splitLine } },
      },
      series: [{
        type: 'line',
        data: values,
        showSymbol: false,
        smooth: opts?.smooth ?? false,
        lineStyle: { width: 1.5 },
        areaStyle: { opacity: 0.15 },
      }],
    };
  }
}
