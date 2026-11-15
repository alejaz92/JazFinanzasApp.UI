import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { IncExpSummaryReportComponent } from './inc-exp-summary-report.component';
import { ReportContextService } from '../../../shared/services/report-context.service';

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
