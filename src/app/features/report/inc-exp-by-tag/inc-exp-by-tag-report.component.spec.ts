import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { IncExpByTagReportComponent } from './inc-exp-by-tag-report.component';
import { SpendingRow, TagSpending } from '../models/income-expense.model';

// plan-ingresos-egresos-por-fecha-de-compra.md, Fase 9 — el clic en una etiqueta abre un panel lateral con sus gastos, en lugar de navegar a /transactions
// (que no lista las compras con tarjeta).
describe('IncExpByTagReportComponent — panel de detalle', () => {
  let fixture: ComponentFixture<IncExpByTagReportComponent>;
  let component: IncExpByTagReportComponent;
  let http: HttpTestingController;
  let router: Router;

  const viaje: TagSpending = { tagId: 9, tagName: 'Viaje', color: '#ff0000', totalAmount: 1000, monthlyEvolution: [], byCategory: [] };

  const pad = (n: number) => n.toString().padStart(2, '0');
  const monthStart = (offset: number) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
  };

  const rowOf = (partial: Partial<SpendingRow>): SpendingRow => ({
    date: '2026-10-09T00:00:00', kind: 'Direct', sourceId: 1, categoryId: 5, categoryName: 'Hospedaje', parentName: null, detail: 'Hotel', amount: 500,
    installmentNumber: null, installments: null, purchaseOwnTotal: null, purchaseDate: null, nativeAssetId: 1, nativeAssetSymbol: '$', nativeAmount: 500,
    nativeGrossTotal: null, nativeOthersShare: null, nativeDiscounts: null, accountId: 3, accountName: 'Santander', cardId: null, cardName: null, ...partial
  });

  beforeEach(async () => {
    (window as any).bootstrap = { Offcanvas: { getOrCreateInstance: () => ({ show: () => {}, hide: () => {} }) } };
    TestBed.configureTestingModule({
      imports: [IncExpByTagReportComponent, HttpClientTestingModule],
      providers: [provideRouter([{ path: '**', children: [] }])]
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    await router.navigateByUrl('/report/inc-exp-by-tag?currency=1');
    fixture = TestBed.createComponent(IncExpByTagReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    http.match(r => /ByTag\/1/.test(r.urlWithParams)); // el pedido de las etiquetas, sin responder
  });

  afterEach(() => {
    http.match(() => true); // el doble de `bootstrap` queda instalado: el panel se abre con un setTimeout que puede disparar después del test
  });

  it('el clic pide los gastos de la etiqueta de los últimos 6 meses y no navega a /transactions', async () => {
    const navigate = spyOn(router, 'navigate').and.callThrough();

    component.openTag(viaje);

    const requests = http.match(r => /SpendingRows\/1/.test(r.urlWithParams));
    expect(requests.length).toBe(1);
    expect(requests[0].request.urlWithParams).toContain(`from=${monthStart(-5)}&to=${monthStart(1)}`);
    expect(requests[0].request.urlWithParams).toContain('tagId=9');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('muestra los gastos de la etiqueta con su suma', async () => {
    component.openTag(viaje);
    http.expectOne(r => /SpendingRows\/1/.test(r.urlWithParams)).flush([
      rowOf({}), rowOf({ sourceId: 2, kind: 'CardInstallment', detail: 'Vuelos', amount: 150000, nativeAmount: 150000, installmentNumber: 3, installments: 6,
        purchaseOwnTotal: 900000, purchaseDate: '2026-08-02T00:00:00', accountName: null, cardName: 'Visa' })
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('Gasto — ');
    expect(text).toContain('Viaje');
    expect(text).toContain('Cuota 3 de 6');
    expect(text).toContain('$ 150.500,00');
    expect(component.selectedTag).toBe(viaje);
  });

  it('sin moneda elegida no pide nada', async () => {
    await router.navigateByUrl('/report/inc-exp-by-tag');
    http.match(() => true);

    component.openTag(viaje);

    expect(http.match(r => /SpendingRows/.test(r.urlWithParams)).length).toBe(0);
  });
});
