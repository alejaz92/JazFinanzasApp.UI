import { TestBed } from '@angular/core/testing';

import { ChartThemeService } from './chart-theme.service';
import { ThemeService } from '../../core/services/theme.service';

describe('ChartThemeService', () => {
  let service: ChartThemeService;
  let themeService: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartThemeService);
    themeService = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('colorAt es determinista: el mismo índice siempre da el mismo color', () => {
    const first = service.colorAt(3);
    const second = service.colorAt(3);
    expect(first).toBe(second);
  });

  it('colorAt no depende de la cantidad total de elementos, solo del índice', () => {
    // A diferencia de generateControlledColors(), que reparte 360/cantidad
    // y por eso el color de un mismo dato cambia si cambia el total.
    expect(service.colorAt(0)).toBe(service.colorAt(0));
    expect(service.colorAt(1)).not.toBe(service.colorAt(0));
  });

  it('colorAt hace wrap-around al superar el largo de la paleta', () => {
    const paletteLength = service.palette.length;
    expect(service.colorAt(paletteLength)).toBe(service.colorAt(0));
    expect(service.colorAt(paletteLength + 2)).toBe(service.colorAt(2));
  });

  it('la paleta tiene 8 colores fijos, sin repetidos', () => {
    const palette = service.palette;
    expect(palette.length).toBe(8);
    expect(new Set(palette).size).toBe(8);
  });

  it('cambia de paleta y de superficie según el tema activo', () => {
    if (themeService.isDark) themeService.toggle(); // asegura arrancar en claro
    const lightColor = service.colorAt(0);
    const lightSurface = service.surface.tooltipBg;

    themeService.toggle(); // pasa a oscuro
    const darkColor = service.colorAt(0);
    const darkSurface = service.surface.tooltipBg;

    expect(darkColor).not.toBe(lightColor);
    expect(darkSurface).not.toBe(lightSurface);
  });

  it('los colores de estado no cambian con el tema', () => {
    if (themeService.isDark) themeService.toggle(); // asegura arrancar en claro
    const lightStatus = service.status.critical;

    themeService.toggle(); // pasa a oscuro
    const darkStatus = service.status.critical;

    expect(darkStatus).toBe(lightStatus);
  });

  it('formatNumber usa separadores es-AR (punto de miles, coma decimal)', () => {
    expect(service.formatNumber(1234.5, { minimumFractionDigits: 2 })).toBe('1.234,50');
  });
});
