import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { IncExpCalendarReportComponent } from './inc-exp-calendar-report.component';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { SpendingCalendar, SpendingRow } from '../models/income-expense.model';

// plan-ingresos-egresos-por-fecha-de-compra.md, Fase 9 — el Calendario con la medida de compra: los recurrentes en una línea aparte (G1) y el panel del
// día con lo que compone ese día.
describe('IncExpCalendarReportComponent — recurrentes y panel del día', () => {
  let fixture: ComponentFixture<IncExpCalendarReportComponent>;
  let component: IncExpCalendarReportComponent;
  let http: HttpTestingController;
  let context: ReportContextService;

  const settle = () => new Promise(resolve => setTimeout(resolve));

  const rowOf = (partial: Partial<SpendingRow>): SpendingRow => ({
    date: '2026-10-05T00:00:00', kind: 'Direct', sourceId: 1, categoryId: 5, categoryName: 'Super', parentName: null, detail: 'Coto', amount: 100,
    installmentNumber: null, installments: null, purchaseOwnTotal: null, purchaseDate: null, nativeAssetId: 1, nativeAssetSymbol: '$', nativeAmount: 100,
    nativeGrossTotal: null, nativeOthersShare: null, nativeDiscounts: null, accountId: 3, accountName: 'Santander', cardId: null, cardName: null, ...partial
  });

  const calendar = (recurring: { month: string; amount: number }[]): SpendingCalendar => ({ year: 2026, days: [], weekdayAverages: [], recurringByMonth: recurring });

  beforeEach(async () => {
    (window as any).bootstrap = { Offcanvas: { getOrCreateInstance: () => ({ show: () => {}, hide: () => {} }) } };
    TestBed.configureTestingModule({
      imports: [IncExpCalendarReportComponent, HttpClientTestingModule],
      providers: [provideRouter([{ path: '**', children: [] }])]
    });
    http = TestBed.inject(HttpTestingController);
    await TestBed.inject(Router).navigateByUrl('/report/inc-exp-calendar?currency=1');
    context = TestBed.inject(ReportContextService);
    fixture = TestBed.createComponent(IncExpCalendarReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    http.match(() => true); // el doble de `bootstrap` queda instalado: el panel se abre con un setTimeout que puede disparar después del test
  });

  // Responde el pedido del año con un calendario y deja la pantalla con los datos.
  async function showCalendar(data: SpendingCalendar): Promise<void> {
    http.expectOne(r => /Calendar\/1/.test(r.urlWithParams)).flush(data);
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
  }

  const recurringLine = () => (fixture.nativeElement as HTMLElement).querySelector('[data-testid="recurring-line"]');

  it('con la medida de compra muestra los recurrentes de cada mes en una línea aparte, con su total del año', async () => {
    await showCalendar(calendar([{ month: '2026-10-01T00:00:00', amount: 256428.55 }, { month: '2026-11-01T00:00:00', amount: 250000 }]));

    const text = recurringLine()!.textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('no tienen un día de compra');
    expect(text).toContain('oct: $ 256.428,55');
    expect(text).toContain('nov: $ 250.000,00');
    expect(text).toContain('Total del año: $ 506.428,55');
  });

  it('sin cargos recurrentes no hay línea', async () => {
    await showCalendar(calendar([]));

    expect(recurringLine()).toBeNull();
  });

  it('con la medida de cuentas no hay línea de recurrentes', async () => {
    context.setSpendingMeasure('accounts');
    await settle();
    fixture.detectChanges();
    // Al mover el interruptor el calendario se vuelve a pedir: queda el pedido de compra, sin responder, y el de cuentas, que es el que importa.
    const accounts = http.match(r => /Calendar\/1/.test(r.urlWithParams)).find(r => r.request.urlWithParams.includes('measure=accounts'))!;
    accounts.flush(calendar([{ month: '2026-10-01T00:00:00', amount: 100 }])); // aunque el backend mandara recurrentes, con cuentas la pantalla no los muestra
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();

    expect(recurringLine()).toBeNull();
  });

  it('el clic en un día pide las filas de ese día (`to` exclusivo) y no los movimientos de cuenta', () => {
    component.onCalendarClick({ value: ['2026-10-05', 100] } as any);

    const rows = http.match(r => /SpendingRows\/1/.test(r.urlWithParams));
    expect(rows.length).toBe(1);
    expect(rows[0].request.urlWithParams).toContain('from=2026-10-05&to=2026-10-06');
    expect(http.match(r => /api\/transaction\?/.test(r.urlWithParams)).length).toBe(0);
  });

  it('el panel del día no lista los recurrentes, que no están en el mapa, y suma lo que el día', async () => {
    component.onCalendarClick({ value: ['2026-10-01', 350] } as any);
    http.expectOne(r => /SpendingRows\/1/.test(r.urlWithParams)).flush([
      rowOf({ amount: 100 }),
      rowOf({ sourceId: 2, kind: 'CardInstallment', detail: 'Buzo', amount: 250, nativeAmount: 250, installmentNumber: 1, installments: 6, purchaseOwnTotal: 1500, purchaseDate: '2026-10-01T00:00:00', accountName: null, cardName: 'Visa' }),
      rowOf({ sourceId: 3, kind: 'CardRecurring', detail: 'Swiss Medical', amount: 94340, nativeAmount: 94340, accountName: null, cardName: 'Visa' }) // cae el día 1 pero no se pinta
    ]);
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
    expect(component.dayRows.length).toBe(2);
    expect(text).toContain('Cuota 1 de 6');
    expect(text).not.toContain('Swiss Medical');
    expect(text).toContain('$ 350,00');
  });
});
