import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ReportContextService } from './report-context.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('ReportContextService', () => {
  let service: ReportContextService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: DummyComponent }])],
    });
    router = TestBed.inject(Router);
    service = TestBed.inject(ReportContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('arranca en "this-month" y sin moneda cuando la URL no trae query params', () => {
    expect(service.period().preset).toBe('this-month');
    expect(service.currencyAssetId()).toBeNull();
  });

  it('lee el período y la moneda desde la URL al navegar', async () => {
    await router.navigateByUrl('/report/inc-exp?period=last-12-months&currency=2');
    expect(service.period().preset).toBe('last-12-months');
    expect(service.currencyAssetId()).toBe(2);
  });

  it('un preset desconocido en la URL cae al default en vez de romper', async () => {
    await router.navigateByUrl('/report/inc-exp?period=bogus');
    expect(service.period().preset).toBe('this-month');
  });

  it('setPeriod actualiza la URL con el nuevo preset', async () => {
    await router.navigateByUrl('/report/inc-exp');
    service.setPeriod('this-year');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(service.period().preset).toBe('this-year');
    expect(router.parseUrl(router.url).queryParams['period']).toBe('this-year');
  });

  it('setPeriod con "custom" guarda el rango; con otro preset lo limpia', async () => {
    await router.navigateByUrl('/report/inc-exp');
    service.setPeriod('custom', { from: '2026-01-01', to: '2026-01-31' });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(service.period()).toEqual({ preset: 'custom', from: '2026-01-01', to: '2026-01-31' });

    service.setPeriod('all');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(service.period().from).toBeUndefined();
    expect(service.period().to).toBeUndefined();
  });

  it('setCurrency actualiza la moneda sin perder el período ya elegido', async () => {
    await router.navigateByUrl('/report/inc-exp?period=last-year');
    service.setCurrency(3);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(service.currencyAssetId()).toBe(3);
    expect(service.period().preset).toBe('last-year');
  });
});

// plan-ingresos-egresos-por-fecha-de-compra.md, Fase 8 — la medida con la que cuenta el gasto vive en la URL (`medida=cuentas`; `compra`, el default,
// se omite), igual que el resto de la barra de filtros de Reportes.
describe('ReportContextService — medida del gasto', () => {
  let service: ReportContextService;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', component: DummyComponent }])] });
    router = TestBed.inject(Router);
    await router.navigateByUrl('/report/inc-exp-summary');
    service = TestBed.inject(ReportContextService);
  });

  it('cuenta por compra por defecto', () => {
    expect(service.spendingMeasure()).toBe('purchase');
  });

  it('lee de la URL que se pidió lo que salió de las cuentas', async () => {
    await router.navigateByUrl('/report/inc-exp-summary?medida=cuentas');

    expect(service.spendingMeasure()).toBe('accounts');
  });

  it('un valor desconocido en la URL cae en la medida por defecto', async () => {
    await router.navigateByUrl('/report/inc-exp-summary?medida=otra-cosa');

    expect(service.spendingMeasure()).toBe('purchase');
  });

  it('al elegir las cuentas lo escribe en la URL', async () => {
    service.setSpendingMeasure('accounts');
    await new Promise(resolve => setTimeout(resolve));

    expect(router.url).toContain('medida=cuentas');
    expect(service.spendingMeasure()).toBe('accounts');
  });

  it('al volver a la compra saca el parámetro de la URL, porque es el default', async () => {
    await router.navigateByUrl('/report/inc-exp-summary?medida=cuentas&currency=1');

    service.setSpendingMeasure('purchase');
    await new Promise(resolve => setTimeout(resolve));

    expect(router.url).not.toContain('medida');
    expect(router.url).toContain('currency=1'); // lo demás de la barra no se toca
    expect(service.spendingMeasure()).toBe('purchase');
  });
});
