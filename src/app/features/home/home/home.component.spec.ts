import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideToastr } from 'ngx-toastr';

import { HomeComponent } from './home.component';
import { DashboardNetWorth, DashboardPendingItem } from '../../report/models/dashboard.model';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let http: HttpTestingController;

  // Los pedidos que le interesan a Inicio (el resto, como los del asistente, no se miran).
  const find = (suffix: string): TestRequest[] => http.match(r => r.url.toLowerCase().endsWith(suffix));
  const one = (suffix: string): TestRequest => {
    const found = find(suffix);
    expect(found.length).withContext(suffix).toBe(1);
    return found[0];
  };

  const netWorth = (hasAccounts = true): DashboardNetWorth => ({
    referenceAssetSymbol: 'ARS', available: 1000, netWorthGross: 5000, netWorthNet: 4200, netWorthChangeVsPreviousMonth: 100,
    hasAccounts, monthly: [], totals: []
  });
  const pendingItem = (severity: DashboardPendingItem['severity']): DashboardPendingItem => ({
    kind: 'CardDue', title: 'Visa', detail: 'Vence pronto', amount: null, assetSymbol: null, date: null, linkId: 1, findingId: null, severity
  });

  beforeEach(() => {
    try { localStorage.removeItem('jaz-home-pending-open'); localStorage.removeItem('jaz-hide-amounts'); } catch { /* sin localStorage */ }

    TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule, HomeComponent],
    // Inicio inyecta ToastService (ngx-toastr): sin este proveedor el componente no se puede crear.
    providers: [provideToastr()],
    schemas: [NO_ERRORS_SCHEMA]
});
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // plan-inicio-rapido.md, Fase 5: los pedidos que no dependen de la moneda de referencia salen ya, sin esperar a saber cuál es.
  it('al abrir pide compromisos, pendientes y la moneda de referencia a la vez; patrimonio y mes esperan a la moneda', () => {
    expect(find('/api/dashboard/commitments').length).toBe(1);
    expect(find('/api/dashboard/pending').length).toBe(1);
    expect(find('/api/asset/reference').length).toBe(1);
    expect(find('/net-worth').length).toBe(0);
    expect(find('/month').length).toBe(0);
  });

  it('con la moneda resuelta pide patrimonio y mes, y ya no pide Monthly ni ByAccount aparte', () => {
    one('/api/asset/reference').flush([{ id: 7, isMainReference: true }]);

    expect(one('/api/dashboard/7/net-worth')).toBeTruthy();
    expect(one('/api/dashboard/7/month')).toBeTruthy();
    expect(find('/api/networth/monthly/7').length).toBe(0);
    expect(find('/api/networth/byaccount/7').length).toBe(0);
  });

  it('cada bloque se dibuja apenas llega, sin esperar a los demás', () => {
    one('/api/asset/reference').flush([{ id: 7, isMainReference: true }]);
    expect(component.commitmentsState).toBe('loading');

    one('/api/dashboard/commitments').flush({ cardsDueAmountInPesos: 1500, cardsNextDueDate: null, sharedBalances: [] });

    expect(component.commitmentsState).toBe('ready');
    expect(component.netWorthState).toBe('loading');
    expect(component.monthState).toBe('loading');
    expect(component.pendingState).toBe('loading');
  });

  it('un bloque que falla no frena a los demás y se reintenta solo ese', () => {
    one('/api/asset/reference').flush([{ id: 7, isMainReference: true }]);
    one('/api/dashboard/pending').flush('error', { status: 500, statusText: 'Server Error' });
    one('/api/dashboard/commitments').flush({ cardsDueAmountInPesos: 0, cardsNextDueDate: null, sharedBalances: [] });
    one('/api/dashboard/7/net-worth').flush(netWorth());

    expect(component.pendingState).toBe('error');
    expect(component.commitmentsState).toBe('ready');
    expect(component.netWorthState).toBe('ready');

    component.retryPending();
    expect(component.pendingState).toBe('loading');
    one('/api/dashboard/pending').flush([pendingItem('warning')]);
    expect(component.pendingState).toBe('ready');
    expect(component.pending.length).toBe(1);
    expect(find('/net-worth').length).toBe(0); // el patrimonio no se volvió a pedir
  });

  it('si falla la moneda de referencia, patrimonio y mes quedan en error y al reintentar se vuelve a pedir', () => {
    one('/api/asset/reference').flush('error', { status: 500, statusText: 'Server Error' });

    expect(component.netWorthState).toBe('error');
    expect(component.monthState).toBe('error');

    component.retryNetWorth();
    one('/api/asset/reference').flush([{ id: 7, isMainReference: true }]);
    expect(component.netWorthState).toBe('loading');
    expect(find('/api/dashboard/7/net-worth').length).toBe(1);
  });

  it('la guía de primer uso sale solo cuando el patrimonio llegó y no hay cuentas con movimientos', () => {
    one('/api/asset/reference').flush([{ id: 7, isMainReference: true }]);
    expect(component.isFirstUse).toBeFalse(); // todavía no se sabe

    one('/api/dashboard/7/net-worth').flush(netWorth(false));
    expect(component.isFirstUse).toBeTrue();
  });

  it('si el patrimonio falla no se muestra la guía de primer uso', () => {
    one('/api/asset/reference').flush([{ id: 7, isMainReference: true }]);
    one('/api/dashboard/7/net-worth').flush('error', { status: 500, statusText: 'Server Error' });

    expect(component.isFirstUse).toBeFalse();
  });

  // plan-inicio-rapido.md, D9: la bandeja va plegada y recuerda si el usuario la abrió.
  describe('bandeja de pendientes plegable', () => {
    it('arranca plegada, con la cantidad de avisos y el color de la gravedad más alta', () => {
      one('/api/dashboard/pending').flush([pendingItem('info'), pendingItem('danger')]);

      expect(component.pendingOpen).toBeFalse();
      expect(component.canTogglePending).toBeTrue();
      expect(component.pendingCount).toBe(2);
      expect(component.pendingSummaryBadgeClass).toBe('bg-danger');
    });

    it('se abre y se cierra con un clic, y lo recuerda', () => {
      one('/api/dashboard/pending').flush([pendingItem('warning')]);

      component.togglePending();
      expect(component.pendingOpen).toBeTrue();
      expect(localStorage.getItem('jaz-home-pending-open')).toBe('true');

      component.togglePending();
      expect(component.pendingOpen).toBeFalse();
      expect(localStorage.getItem('jaz-home-pending-open')).toBe('false');
    });

    it('sin avisos no hay nada que abrir', () => {
      one('/api/dashboard/pending').flush([]);

      expect(component.canTogglePending).toBeFalse();
      component.togglePending();
      expect(component.pendingOpen).toBeFalse();
    });
  });
});
