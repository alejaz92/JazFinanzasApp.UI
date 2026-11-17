import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { IncExpSummaryReportComponent } from './inc-exp-summary-report.component';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { CardReconciliation, IncExpWaterfall } from '../models/income-expense.model';

// plan-ingresos-egresos-por-fecha-de-compra.md, Fase 8 — el Resumen del mes pide los datos con la medida elegida en la barra y vuelve a pedirlos
// cuando se mueve el interruptor. Los otros tres reportes con interruptor (Evolución, Por categoría y Calendario) usan el mismo mecanismo.
describe('IncExpSummaryReportComponent — medida del gasto', () => {
  let fixture: ComponentFixture<IncExpSummaryReportComponent>;
  let http: HttpTestingController;
  let router: Router;
  let context: ReportContextService;

  const settle = () => new Promise(resolve => setTimeout(resolve));
  const waterfallRequests = () => http.match(r => /Waterfall\/1/.test(r.urlWithParams));

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [IncExpSummaryReportComponent, HttpClientTestingModule],
      providers: [provideRouter([{ path: '**', children: [] }])]
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    await router.navigateByUrl('/report/inc-exp-summary?currency=1');
    context = TestBed.inject(ReportContextService);
    fixture = TestBed.createComponent(IncExpSummaryReportComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    waterfallRequests(); // lo que quede pendiente no es lo que se prueba
    http.verify();
  });

  it('pide el Resumen con la medida de compra por defecto', () => {
    const requests = waterfallRequests();

    expect(requests.length).toBe(1);
    expect(requests[0].request.urlWithParams).toContain('measure=purchase');
  });

  it('muestra el aviso de la medida de compra', () => {
    waterfallRequests();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="spending-measure-notice"]')!.textContent!;
    expect(text).toContain('una cuota por mes');
  });

  it('al pasar a lo que salió de las cuentas vuelve a pedir el Resumen con esa medida y cambia el aviso', async () => {
    waterfallRequests(); // el primer pedido, sin responder

    context.setSpendingMeasure('accounts');
    await settle();
    fixture.detectChanges();
    await fixture.whenStable();

    const requests = waterfallRequests();
    expect(requests.length).toBe(1);
    expect(requests[0].request.urlWithParams).toContain('measure=accounts');
    const text = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="spending-measure-notice"]')!.textContent!;
    expect(text).toContain('Lo que salió de tus cuentas');
  });
});

// Fase 10 — la conciliación "Cómo se llega al gasto con tarjeta" y el aviso de resumen sin cargar.
describe('IncExpSummaryReportComponent — conciliación y resumen sin cargar', () => {
  let fixture: ComponentFixture<IncExpSummaryReportComponent>;
  let component: IncExpSummaryReportComponent;
  let http: HttpTestingController;
  let context: ReportContextService;

  const settle = () => new Promise(resolve => setTimeout(resolve));
  const el = () => fixture.nativeElement as HTMLElement;
  const section = (statementAmount: number, spending: number) => ({ statementAmount, othersShare: 0, discounts: 0, notCounted: 0, rounding: 0, spending });
  const waterfall = (missing: boolean): IncExpWaterfall => ({ month: '2026-11-01T00:00:00', totalIncome: 100, expenseSteps: [], totalExpense: 50, result: 50, previousMonthResult: 0, previousTotalIncome: 0, cardStatementMissing: missing });
  const reconciliation = (): CardReconciliation => ({
    month: '2026-11-01T00:00:00', pesos: { statementAmount: 1000, othersShare: 100, discounts: 50, notCounted: 0, rounding: 0, spending: 850 }, dollars: section(0, 0),
    dollarsInPesos: 0, blueRateUsed: null, totalPesos: 850, underpaidInstallmentsCount: 2, underpaidInstallmentsAmount: 300
  });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [IncExpSummaryReportComponent, HttpClientTestingModule],
      providers: [provideRouter([{ path: '**', children: [] }])]
    });
    http = TestBed.inject(HttpTestingController);
    await TestBed.inject(Router).navigateByUrl('/report/inc-exp-summary?currency=1');
    context = TestBed.inject(ReportContextService);
    fixture = TestBed.createComponent(IncExpSummaryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => { http.match(() => true); });

  async function showWaterfall(missing = false): Promise<void> {
    http.expectOne(r => /Waterfall\/1/.test(r.urlWithParams)).flush(waterfall(missing));
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
  }

  const reconciliationRequests = () => http.match(r => /CardReconciliation/.test(r.urlWithParams));

  it('no pide la conciliación hasta que se abre el bloque', async () => {
    await showWaterfall();

    expect(reconciliationRequests().length).toBe(0);
    expect(el().querySelector('[data-testid="card-reconciliation"]')).not.toBeNull();
  });

  it('al abrirlo la pide para el mes y muestra el total y las cuotas pagadas de menos', async () => {
    await showWaterfall();

    component.toggleReconciliation();
    const requests = reconciliationRequests();
    expect(requests.length).toBe(1);
    expect(requests[0].request.urlWithParams).toMatch(/month=\d{4}-\d{2}-01/);
    requests[0].flush(reconciliation());
    fixture.detectChanges();

    const text = el().textContent!.replace(/\s+/g, ' ');
    expect(el().querySelector('[data-testid="reconciliation-total"]')!.textContent).toContain('850,00');
    expect(text).toContain('2 cuotas se pagaron');
    expect(el().querySelector('[data-testid="reconciliation-rate"]')).toBeNull(); // sin dólares no hay nota de cotización
  });

  it('cerrarlo y abrirlo de nuevo no repite el pedido', async () => {
    await showWaterfall();
    component.toggleReconciliation();
    reconciliationRequests()[0].flush(reconciliation());

    component.toggleReconciliation();
    component.toggleReconciliation();

    expect(reconciliationRequests().length).toBe(0);
  });

  it('con la medida de cuentas no hay bloque de conciliación', async () => {
    context.setSpendingMeasure('accounts');
    await settle();
    fixture.detectChanges();
    http.match(r => /Waterfall\/1/.test(r.urlWithParams)).find(r => r.request.urlWithParams.includes('measure=accounts'))!.flush(waterfall(false));
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();

    expect(el().querySelector('[data-testid="card-reconciliation"]')).toBeNull();
  });

  it('con cuentas y el resumen sin cargar avisa que falta el gasto de tarjeta', async () => {
    context.setSpendingMeasure('accounts');
    await settle();
    fixture.detectChanges();
    http.match(r => /Waterfall\/1/.test(r.urlWithParams)).find(r => r.request.urlWithParams.includes('measure=accounts'))!.flush(waterfall(true));
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();

    expect(el().querySelector('[data-testid="statement-missing"]')!.textContent).toContain('todavía no está cargado');
  });

  it('con la medida de compra no muestra el aviso de resumen sin cargar', async () => {
    await showWaterfall(true);

    expect(el().querySelector('[data-testid="statement-missing"]')).toBeNull();
  });
});
