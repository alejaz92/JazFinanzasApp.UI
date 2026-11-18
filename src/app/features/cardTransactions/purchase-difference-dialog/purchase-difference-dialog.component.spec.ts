import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PurchaseDifferenceDialogComponent } from './purchase-difference-dialog.component';
import { PurchaseDifferenceChoice, PurchaseDifferenceContext, differenceThreshold } from '../models/purchase-difference.model';
import { CurrencyFiatFormatPipe } from 'src/app/shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

// plan-repartos-y-descuentos-faltantes.md, Fase 7 — el diálogo que pregunta qué fue la diferencia entre el valor de una cuota y lo que se pagó.
describe('PurchaseDifferenceDialogComponent', () => {
  let component: PurchaseDifferenceDialogComponent;
  let fixture: ComponentFixture<PurchaseDifferenceDialogComponent>;
  let http: HttpTestingController;
  let choices: PurchaseDifferenceChoice[];

  const lessContext: PurchaseDifferenceContext = {
    detail: 'Compra Coto', installmentLabel: '1/1', difference: 18000, symbol: '$', allowFixTotal: false, allowRevert: true
  };
  const moreContext: PurchaseDifferenceContext = {
    detail: 'Compra Coto', installmentLabel: '1/1', difference: -9500, symbol: '$', allowFixTotal: true, allowRevert: true
  };

  // Otros specs reemplazan el global `bootstrap` con dobles y no lo restauran: este instala el suyo y deja el que había.
  let originalBootstrap: any;

  beforeEach(() => {
    originalBootstrap = (window as any).bootstrap;
    (window as any).bootstrap = { Modal: class { show() {} hide() {} } };

    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, PurchaseDifferenceDialogComponent] });
    fixture = TestBed.createComponent(PurchaseDifferenceDialogComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    choices = [];
    component.chosen.subscribe(c => choices.push(c));
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/api/person')).flush([
      { id: 1, name: 'Franco', userId: 1 },
      { id: 2, name: 'Ana', alias: 'Anita', userId: 1 }
    ]);
  });

  afterEach(() => {
    (window as any).bootstrap = originalBootstrap;
  });

  // Prepara el estado del diálogo sin abrir el modal de Bootstrap.
  function prepare(context: PurchaseDifferenceContext): void {
    component.context = context;
    fixture.detectChanges();
  }

  it('should create and load the people', () => {
    expect(component).toBeTruthy();
    expect(component.people.map(p => p.name)).toEqual(['Franco', 'Ana']);
    expect(component.personName(component.people[1])).toBe('Ana (Anita)');
  });

  it('should say whether the installment was paid for less or for more', () => {
    prepare(lessContext);
    expect(component.paidLess).toBeTrue();
    expect(component.absoluteDifference).toBe(18000);
    expect(component.title).toBe('Pagás menos que la cuota');

    prepare(moreContext);
    expect(component.paidLess).toBeFalse();
    expect(component.absoluteDifference).toBe(9500);
    expect(component.title).toBe('Pagás más que la cuota');
  });

  it('should offer the discount and the people only when paying less, and fixing the total only when paying more in a single installment', () => {
    prepare(lessContext);
    const less = (fixture.nativeElement as HTMLElement).textContent!;
    expect(less).toContain('Un descuento del banco');
    expect(less).toContain('La parte de otra persona');
    expect(less).not.toContain('El total de la compra estaba mal cargado');

    prepare(moreContext);
    const more = (fixture.nativeElement as HTMLElement).textContent!;
    expect(more).not.toContain('Un descuento del banco');
    expect(more).toContain('El total de la compra estaba mal cargado');

    prepare({ ...moreContext, allowFixTotal: false });
    expect((fixture.nativeElement as HTMLElement).textContent!).not.toContain('El total de la compra estaba mal cargado');
  });

  it('should show the amounts in dollars when the purchase is in dollars', () => {
    prepare({ ...lessContext, difference: 5, symbol: 'US$' });
    expect((fixture.nativeElement as HTMLElement).textContent!).toContain('US$ 5,00');
  });

  it('should not confirm until something is chosen', () => {
    prepare(lessContext);
    expect(component.canConfirm).toBeFalse();

    component.confirm();

    expect(choices).toEqual([]);
  });

  it('should emit the discount', () => {
    prepare(lessContext);
    component.select('Discount');
    expect(component.canConfirm).toBeTrue();

    component.confirm();

    expect(choices).toEqual([{ kind: 'Discount' }]);
  });

  it('should emit fixing the total', () => {
    prepare(moreContext);
    component.select('FixTotal');

    component.confirm();

    expect(choices).toEqual([{ kind: 'FixTotal' }]);
  });

  it('should start the people with a row holding the whole difference', () => {
    prepare(lessContext);

    component.select('People');

    expect(component.rows.length).toBe(1);
    expect(component.rows[0].amount).toBe(18000);
    expect(component.remaining).toBe(0);
    // Todavía falta elegir la persona.
    expect(component.canConfirm).toBeFalse();
  });

  it('should require the people to add up to the difference', () => {
    prepare(lessContext);
    component.select('People');
    component.rows[0].personId = 1;
    expect(component.canConfirm).toBeTrue();

    component.rows[0].amount = 10000;
    expect(component.remaining).toBe(8000);
    expect(component.canConfirm).toBeFalse();

    component.addRow();                       // la siguiente fila sugiere lo que falta
    expect(component.rows[1].amount).toBe(8000);
    component.rows[1].personId = 2;
    expect(component.remaining).toBe(0);
    expect(component.canConfirm).toBeTrue();

    component.rows[1].amount = 9000;          // se repartió de más
    expect(component.remaining).toBe(-1000);
    expect(component.canConfirm).toBeFalse();
  });

  it('should accept the people adding up to the difference within a cent', () => {
    prepare({ ...lessContext, difference: 100 });
    component.select('People');
    component.rows[0].personId = 1;
    component.rows[0].amount = 33.33;
    component.addRow();
    component.rows[1].personId = 2;
    component.rows[1].amount = 66.67;

    expect(component.canConfirm).toBeTrue();
    component.rows[1].amount = 66.66;           // 0,01 de diferencia: dentro de la tolerancia
    expect(component.canConfirm).toBeTrue();
    component.rows[1].amount = 66.5;
    expect(component.canConfirm).toBeFalse();
  });

  it('should emit the people with their amounts', () => {
    prepare(lessContext);
    component.select('People');
    component.rows[0].personId = 1;
    component.rows[0].amount = 12000;
    component.addRow();
    component.rows[1].personId = 2;

    component.confirm();

    expect(choices).toEqual([{ kind: 'People', people: [{ personId: 1, amount: 12000 }, { personId: 2, amount: 6000 }] }]);
  });

  it('should not allow a row without person or without amount', () => {
    prepare(lessContext);
    component.select('People');
    component.rows[0].personId = 1;
    component.rows[0].amount = 0;

    expect(component.canConfirm).toBeFalse();

    component.rows[0].amount = 18000;
    component.rows[0].personId = null;

    expect(component.canConfirm).toBeFalse();
  });

  it('should keep at least one person row', () => {
    prepare(lessContext);
    component.select('People');

    component.removeRow(0);
    expect(component.rows.length).toBe(0);
    expect(component.canConfirm).toBeFalse();
  });

  it('should emit "later" and "revert"', () => {
    prepare(lessContext);
    component.later();
    expect(choices).toEqual([{ kind: 'Later' }]);
  });

  it('should emit "revert"', () => {
    prepare(lessContext);
    component.revert();
    expect(choices).toEqual([{ kind: 'Revert' }]);
  });

  it('should answer only once', () => {
    prepare(lessContext);
    component.open(lessContext);
    component.select('Discount');

    component.confirm();
    component.later();

    expect(choices).toEqual([{ kind: 'Discount' }]);
  });

  it('should count closing the dialog without choosing as "later"', () => {
    component.open(lessContext);

    // Cerrar el modal (la X, Escape o un clic afuera) dispara este evento de Bootstrap.
    component.modalRef.nativeElement.dispatchEvent(new Event('hidden.bs.modal'));

    expect(choices).toEqual([{ kind: 'Later' }]);
  });

  it('should show the revert button only when it is allowed', () => {
    prepare({ ...lessContext, allowRevert: false });
    expect((fixture.nativeElement as HTMLElement).textContent!).not.toContain('Es un error');

    prepare({ ...lessContext, allowRevert: true });
    expect((fixture.nativeElement as HTMLElement).textContent!).toContain('Es un error');
  });
});

describe('differenceThreshold', () => {
  it('should be one peso and a cent of a dollar', () => {
    expect(differenceThreshold('$')).toBe(1);
    expect(differenceThreshold('US$')).toBe(0.01);
  });
});

describe('CurrencyFiatFormatPipe symbol', () => {
  const pipe = new CurrencyFiatFormatPipe();

  it('should keep "$" by default', () => {
    expect(pipe.transform(1234.5)).toBe('$ 1.234,50');
  });

  it('should use the symbol it is given', () => {
    expect(pipe.transform(12.3, 'US$')).toBe('US$ 12,30');
    expect(pipe.transform(-5, 'US$')).toBe('US$ -5,00');
  });
});
