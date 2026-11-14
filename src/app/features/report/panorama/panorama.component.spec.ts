import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { PanoramaComponent } from './panorama.component';
import { DashboardNetWorth } from '../models/dashboard.model';
import { ReportContextService } from '../../../shared/services/report-context.service';

// plan-inicio-rapido.md, Fase 6: el Panorama pide el resumen por bloques, igual que Inicio.
describe('PanoramaComponent', () => {
  let fixture: ComponentFixture<PanoramaComponent>;
  let component: PanoramaComponent;
  let http: HttpTestingController;
  let reportContext: ReportContextService;

  const find = (suffix: string): TestRequest[] => http.match(r => r.url.toLowerCase().endsWith(suffix));
  const one = (suffix: string): TestRequest => {
    const found = find(suffix);
    expect(found.length).withContext(suffix).toBe(1);
    return found[0];
  };

  const netWorth = (): DashboardNetWorth => ({
    referenceAssetSymbol: 'ARS', available: 1000, netWorthGross: 5000, netWorthNet: 4200, netWorthChangeVsPreviousMonth: 100,
    hasAccounts: true, monthly: [], totals: [{ asset: 'Peso Argentino', symbol: 'ARS', color: '#112233', grossBalance: 5000, cardDebt: 0, netBalance: 5000 }]
  });

  // El filtro de moneda vive en la URL y lo maneja reports-shell: acá se fija directo.
  const chooseCurrency = (assetId: number) => {
    (reportContext as unknown as { currency: { set(v: number | null): void } }).currency.set(assetId);
    fixture.detectChanges(); // los effect() de un componente corren en la detección de cambios
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, PanoramaComponent],
      schemas: [NO_ERRORS_SCHEMA]
    });
    http = TestBed.inject(HttpTestingController);
    reportContext = TestBed.inject(ReportContextService);
    fixture = TestBed.createComponent(PanoramaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('compromisos y pendientes salen ya, sin esperar a que se elija una moneda; patrimonio y mes no', () => {
    expect(find('/api/dashboard/commitments').length).toBe(1);
    expect(find('/api/dashboard/pending').length).toBe(1);
    expect(find('/net-worth').length).toBe(0);
    expect(find('/month').length).toBe(0);
    expect(component.currencyChosen).toBeFalse();
  });

  it('al elegir la moneda pide patrimonio y mes, y ya no pide Monthly ni General aparte', () => {
    chooseCurrency(7);

    expect(find('/api/dashboard/7/net-worth').length).toBe(1);
    expect(find('/api/dashboard/7/month').length).toBe(1);
    expect(find('/api/networth/monthly/7').length).toBe(0);
    expect(find('/api/networth/general').length).toBe(0);
  });

  it('los totales por moneda de arriba salen del bloque de patrimonio', () => {
    chooseCurrency(7);
    one('/api/dashboard/7/net-worth').flush(netWorth());

    expect(component.netWorthState).toBe('ready');
    expect(component.totals.length).toBe(1);
    expect(component.totals[0].symbol).toBe('ARS');
  });

  it('cada bloque se dibuja apenas llega y uno que falla no frena a los demás', () => {
    chooseCurrency(7);
    one('/api/dashboard/commitments').flush({ cardsDueAmountInPesos: 1500, cardsNextDueDate: null, sharedBalances: [] });
    one('/api/dashboard/pending').flush('error', { status: 500, statusText: 'Server Error' });

    expect(component.commitmentsState).toBe('ready');
    expect(component.pendingState).toBe('error');
    expect(component.netWorthState).toBe('loading');
    expect(component.monthState).toBe('loading');

    component.retryPending();
    expect(component.pendingState).toBe('loading');
    expect(find('/net-worth').length).toBe(1); // el pedido de patrimonio sigue en vuelo, no se repitió
  });

  it('al cambiar de moneda se vuelven a pedir patrimonio y mes, y la respuesta de la moneda anterior se descarta', () => {
    chooseCurrency(7);
    const staleNetWorth = one('/api/dashboard/7/net-worth');
    one('/api/dashboard/7/month');

    chooseCurrency(8);
    expect(find('/api/dashboard/8/net-worth').length).toBe(1);

    staleNetWorth.flush(netWorth()); // llega tarde: ya no es la moneda elegida
    expect(component.netWorth).toBeNull();
    expect(component.netWorthState).toBe('loading');
  });

  it('si falla el patrimonio solo ese bloque queda en error y se reintenta con la moneda elegida', () => {
    chooseCurrency(7);
    one('/api/dashboard/7/net-worth').flush('error', { status: 500, statusText: 'Server Error' });
    one('/api/dashboard/7/month').flush({
      referenceAssetSymbol: 'ARS', monthResult: 1, monthResultPreviousMonth: 1, monthExpense: 1, monthExpenseAverage: 1,
      thermometer: { monthToDateAmount: 0, previousMonthSameDayAmount: 0, projectedMonthEndAmount: 0, daysElapsed: 1, daysInMonth: 30 }
    });

    expect(component.netWorthState).toBe('error');
    expect(component.monthState).toBe('ready');

    component.retryNetWorth();
    expect(component.netWorthState).toBe('loading');
    expect(find('/api/dashboard/7/net-worth').length).toBe(1);
  });
});
