import { Injectable, inject } from '@angular/core';
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
   * mismo índice, y vuelve a empezar (wrap-around) al superar el largo de
   * la paleta — nunca `undefined` ni depende de cuántos elementos haya en total.
   */
  colorAt(i: number): string {
    const palette = this.palette;
    const n = palette.length;
    return palette[((i % n) + n) % n];
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
}
