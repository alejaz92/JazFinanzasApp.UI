import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpendingMeasureNoticeComponent } from './spending-measure-notice.component';
import { SpendingMeasure } from '../../services/report-context.service';

// plan-ingresos-egresos-por-fecha-de-compra.md, Fase 8, decisión C1 — la línea fija que dice con qué medida cuenta el gasto, y que cambia con el interruptor.
describe('SpendingMeasureNoticeComponent', () => {
  let fixture: ComponentFixture<SpendingMeasureNoticeComponent>;

  function render(measure: SpendingMeasure): string {
    fixture = TestBed.createComponent(SpendingMeasureNoticeComponent);
    fixture.componentRef.setInput('measure', measure);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ').trim();
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [SpendingMeasureNoticeComponent] }));

  it('con la medida de compra explica la cuota por mes, la compra hecha después del cierre, la parte propia y los recurrentes', () => {
    const text = render('purchase');

    expect(text).toContain('una cuota por mes');
    expect(text).toContain('desde el mes de su primer resumen');
    expect(text).toContain('las hechas después del cierre, el día 1 del mes siguiente');
    expect(text).toContain('sin lo que te devuelven otros');
    expect(text).toContain('Los cargos recurrentes cuentan en cada mes');
    expect(text).not.toContain('Lo que salió de tus cuentas');
  });

  it('con la medida de cuentas dice que la tarjeta cuenta cuando se carga el pago del resumen', () => {
    const text = render('accounts');

    expect(text).toContain('Lo que salió de tus cuentas');
    expect(text).toContain('cuando se carga el pago del resumen, fechado el día 1 del mes');
    expect(text).not.toContain('una cuota por mes');
  });

  it('es una nota (role="note") para los lectores de pantalla', () => {
    render('purchase');

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="note"]')).not.toBeNull();
  });
});
