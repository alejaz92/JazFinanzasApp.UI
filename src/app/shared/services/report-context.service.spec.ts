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
