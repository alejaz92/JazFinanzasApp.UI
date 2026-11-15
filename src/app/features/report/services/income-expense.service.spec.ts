import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { IncomeExpenseService } from './income-expense.service';

// plan-ingresos-egresos-por-fecha-de-compra.md, Fase 8 — los cuatro reportes de gasto con interruptor mandan SIEMPRE `measure`: el backend, sin el
// parámetro, responde con lo que salió de las cuentas, así que omitirlo mostraría una medida distinta a la que dice la pantalla.
describe('IncomeExpenseService — medida del gasto', () => {
  let service: IncomeExpenseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(IncomeExpenseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const urlOf = (matcher: RegExp) => http.expectOne(r => matcher.test(r.urlWithParams)).request.urlWithParams;

  it('el Resumen manda la medida de compra', () => {
    service.getWaterfall(1, '2026-10-01', 'purchase').subscribe();

    expect(urlOf(/Waterfall\/1/)).toContain('month=2026-10-01&measure=purchase');
  });

  it('el Resumen manda la medida de cuentas', () => {
    service.getWaterfall(1, '2026-10-01', 'accounts').subscribe();

    expect(urlOf(/Waterfall\/1/)).toContain('measure=accounts');
  });

  it('la Evolución manda la medida', () => {
    service.getEvolution(1, 24, 'purchase').subscribe();

    expect(urlOf(/Evolution\/1/)).toContain('months=24&measure=purchase');
  });

  it('Por categoría manda la medida', () => {
    service.getByCategory(2, '2026-10-01', 'accounts').subscribe();

    expect(urlOf(/ByCategory\/2/)).toContain('month=2026-10-01&measure=accounts');
  });

  it('el Calendario manda la medida', () => {
    service.getCalendar(1, 2026, 'purchase').subscribe();

    expect(urlOf(/Calendar\/1/)).toContain('year=2026&measure=purchase');
  });

  it('Por etiqueta no manda medida: mide siempre por compra', () => {
    service.getByTag(1, 6).subscribe();

    expect(urlOf(/ByTag\/1/)).not.toContain('measure');
  });

  // ── El detalle de lo que compone el gasto (Fase 9) ──────────────────────────────────────────────

  it('el detalle de una categoría pide las filas del mes con `to` exclusivo y el filtro de categoría', () => {
    service.getSpendingRows(1, '2026-10-01', '2026-11-01', { categoryId: 5 }).subscribe();

    const url = urlOf(/SpendingRows\/1/);
    expect(url).toContain('from=2026-10-01&to=2026-11-01');
    expect(url).toContain('&categoryId=5');
    expect(url).not.toContain('tagId');
  });

  it('el detalle de una etiqueta manda el filtro de etiqueta y no el de categoría', () => {
    service.getSpendingRows(1, '2026-05-01', '2026-11-01', { tagId: 9 }).subscribe();

    const url = urlOf(/SpendingRows\/1/);
    expect(url).toContain('&tagId=9');
    expect(url).not.toContain('categoryId');
  });

  it('el detalle de un día no manda ningún filtro', () => {
    service.getSpendingRows(2, '2026-10-05', '2026-10-06').subscribe();

    expect(urlOf(/SpendingRows\/2/)).toMatch(/from=2026-10-05&to=2026-10-06$/);
  });
});
