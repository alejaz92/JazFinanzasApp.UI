import { ChartThemeService } from './chart-theme.service';

describe('ChartThemeService', () => {
  let service: ChartThemeService;

  beforeEach(() => {
    service = new ChartThemeService();
  });

  it('create an instance', () => {
    expect(service).toBeTruthy();
  });

  it('colorAt devuelve siempre el mismo color para el mismo índice', () => {
    const first = service.colorAt(2);
    const second = service.colorAt(2);
    const third = service.colorAt(2);
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('colorAt hace wrap-around cuando el índice supera el tamaño de la paleta (10 colores)', () => {
    expect(service.colorAt(0)).toBe(service.colorAt(10));
    expect(service.colorAt(3)).toBe(service.colorAt(13));
  });

  it('colors(n) devuelve n colores consistentes con colorAt', () => {
    const colors = service.colors(5);
    expect(colors.length).toBe(5);
    colors.forEach((color, i) => expect(color).toBe(service.colorAt(i)));
  });
});
