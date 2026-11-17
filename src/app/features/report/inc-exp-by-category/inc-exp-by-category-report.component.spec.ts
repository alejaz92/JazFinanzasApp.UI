import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { IncExpByCategoryReportComponent } from './inc-exp-by-category-report.component';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { CategoryDetail, SpendingRow } from '../models/income-expense.model';

// plan-ingresos-egresos-por-fecha-de-compra.md, Fase 9 — con la medida de compra, el panel de una categoría muestra lo que compone el número (gasto por
// gasto), y con la de cuentas sigue siendo la lista de movimientos de siempre.
describe('IncExpByCategoryReportComponent — panel de detalle', () => {
  let fixture: ComponentFixture<IncExpByCategoryReportComponent>;
  let component: IncExpByCategoryReportComponent;
  let http: HttpTestingController;
  let context: ReportContextService;

  const settle = () => new Promise(resolve => setTimeout(resolve));
  const ropa: CategoryDetail = { categoryId: 5, categoryName: 'Ropa', amount: 100, monthlyTrend: [1, 2, 3, 4, 5, 100], rankCurrent: 1, rankPrevious: null };

  const pad = (n: number) => n.toString().padStart(2, '0');
  const monthStart = (offset: number) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
  };

  function row(partial: Partial<SpendingRow>): SpendingRow {
    return {
      date: '2026-10-09T00:00:00', kind: 'CardInstallment', sourceId: 1, categoryId: 5, categoryName: 'Ropa', parentName: null, detail: 'Remeras', amount: 22777.48,
      installmentNumber: 3, installments: 9, purchaseOwnTotal: 204997.32, purchaseDate: '2026-08-08T00:00:00', nativeAssetId: 1, nativeAssetSymbol: '$', nativeAmount: 22777.48,
      nativeGrossTotal: 204997.32, nativeOthersShare: 0, nativeDiscounts: 0, accountId: null, accountName: null, cardId: 7, cardName: 'Visa Santander',
      ...partial
    };
  }

  beforeEach(async () => {
    // bootstrap lo trae la página real; acá solo hace falta que el panel "se abra".
    (window as any).bootstrap = { Offcanvas: { getOrCreateInstance: () => ({ show: () => {}, hide: () => {} }) } };
    TestBed.configureTestingModule({
      imports: [IncExpByCategoryReportComponent, HttpClientTestingModule],
      providers: [provideRouter([{ path: '**', children: [] }])]
    });
    http = TestBed.inject(HttpTestingController);
    await TestBed.inject(Router).navigateByUrl('/report/inc-exp-by-category?currency=1');
    context = TestBed.inject(ReportContextService);
    fixture = TestBed.createComponent(IncExpByCategoryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    http.match(r => /ByCategory\/1/.test(r.urlWithParams)); // el pedido del mapa, sin responder
  });

  afterEach(() => {
    http.match(() => true); // el doble de `bootstrap` queda instalado: el panel se abre con un setTimeout que puede disparar después del test
  });

  it('con la medida de compra pide las filas del mes de esa categoría, sin pedir movimientos de cuenta', () => {
    component.openCategory(ropa);

    const rows = http.match(r => /SpendingRows\/1/.test(r.urlWithParams));
    expect(rows.length).toBe(1);
    expect(rows[0].request.urlWithParams).toContain(`from=${monthStart(0)}&to=${monthStart(1)}`);
    expect(rows[0].request.urlWithParams).toContain('categoryId=5');
    expect(http.match(r => /api\/transaction\?/.test(r.urlWithParams)).length).toBe(0);
  });

  it('muestra las filas: la cuota, la compra entera y la suma al pie', async () => {
    component.openCategory(ropa);
    http.expectOne(r => /SpendingRows\/1/.test(r.urlWithParams)).flush([row({}), row({ sourceId: 2, kind: 'CardRecurring', detail: 'Swiss Medical', amount: 94340, nativeAmount: 94340, installmentNumber: null, installments: null, purchaseOwnTotal: null, purchaseDate: null })]);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('Cuota 3 de 9');
    expect(text).toContain('compra del 08/08/2026');
    expect(text).toContain('recurrente');
    expect(text).toContain('$ 117.117,48'); // 22.777,48 + 94.340,00
    expect(text).toContain('Gasto — Ropa');
  });

  it('con la medida de cuentas el panel sigue siendo la lista de movimientos', async () => {
    context.setSpendingMeasure('accounts');
    await settle();
    fixture.detectChanges();
    http.match(r => /ByCategory\/1/.test(r.urlWithParams));

    component.openCategory(ropa);

    expect(http.match(r => /SpendingRows/.test(r.urlWithParams)).length).toBe(0);
    const movements = http.match(r => /api\/transaction\?/.test(r.urlWithParams));
    expect(movements.length).toBe(1);
    expect(movements[0].request.urlWithParams).toContain('classId=5');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Movimientos — Ropa');
  });

  it('al cambiar la medida se cierra el panel que estaba abierto: era de la medida anterior', async () => {
    component.openCategory(ropa);
    http.match(r => /SpendingRows/.test(r.urlWithParams));
    expect(component.selectedCategory).not.toBeNull();

    context.setSpendingMeasure('accounts');
    await settle();
    fixture.detectChanges();

    expect(component.selectedCategory).toBeNull();
    expect(component.categoryRows).toEqual([]);
  });
});
