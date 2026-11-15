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
});
