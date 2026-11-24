import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideToastr } from 'ngx-toastr';
import { of } from 'rxjs';

import { CardTransactionsPayComponent } from './card-transactions-pay.component';

describe('CardTransactionsPayComponent', () => {
  let component: CardTransactionsPayComponent;
  let fixture: ComponentFixture<CardTransactionsPayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule, CardTransactionsPayComponent],
    providers: [provideToastr()],
    schemas: [NO_ERRORS_SCHEMA]
});
    fixture = TestBed.createComponent(CardTransactionsPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should suggest next closing/due dates in the payment form, one month after the card ones', () => {
    component.cards = [{ id: 4, name: 'Amex', nextClosingDate: '2026-10-01T00:00:00', nextDueDate: '2026-10-13T00:00:00' }];
    component.cardPaymentForm.get('card')!.setValue('4', { emitEvent: false });

    (component as any).suggestNextDates();

    expect(component.cardPaymentForm.get('nextClosingDate')!.value).toBe('2026-11-01');
    expect(component.cardPaymentForm.get('nextDueDate')!.value).toBe('2026-11-13');
  });

  describe('onSubmit next dates', () => {
    let createSpy: jasmine.Spy;

    beforeEach(() => {
      createSpy = spyOn((component as any).cardTransactionService, 'createCardPayment');
      component.cardPaymentForm.patchValue({
        card: '4', account: '1', paymentAssets: 'Pesos', pesosPayment: '100', cardExpenses: '0'
      }, { emitEvent: false });
    });

    it('should not register the payment when the next dates are empty', () => {
      component.cardPaymentForm.patchValue({ nextClosingDate: '', nextDueDate: '' }, { emitEvent: false });

      component.onSubmit();

      expect(createSpy).not.toHaveBeenCalled();
      expect(component.cardPaymentForm.get('nextClosingDate')!.touched).toBeTrue();
    });

    it('should not register the payment when the due date is before the closing date', () => {
      component.cardPaymentForm.patchValue({ nextClosingDate: '2026-10-29', nextDueDate: '2026-10-20' }, { emitEvent: false });

      component.onSubmit();

      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  // plan-repartos-y-descuentos-faltantes.md, Fase 7 — la pregunta por la diferencia entre el valor de la cuota y lo que se paga.
  describe('difference between the installment and what is paid', () => {
    let openSpy: jasmine.Spy;
    let createSpy: jasmine.Spy;

    // Una cuota de 100.000 (ARS) de la compra 20, con la forma que arma `populateCardTransactionsArray`.
    const row = (overrides: any = {}) => ({
      cardTransactionId: 20, installmentNumber: 1, date: '2026-09-12', cardId: 4, card: 'Visa', transactionClassId: 3, transactionClass: 'Super',
      detail: 'Compra Coto', assetId: 1, asset: 'Peso Argentino', installment: '1/1', installmentAmount: 100000, valueInPesos: 100000, pay: true,
      ...overrides
    });

    function load(rows: any[], payingIn: string = 'Pesos'): void {
      // El formulario (y el diálogo) se dibujan cuando termina de cargar.
      component.isLoading = false;
      fixture.detectChanges();
      component.selectedPaymentAssets = payingIn;
      component.populateCardTransactionsArray(rows);
      component.updateEditOptions();
      openSpy = spyOn(component.differenceDialog!, 'open');
    }

    const control = (i = 0) => component.cardTransactionsArray.at(i);

    it('should ask what the difference was when the installment is paid for less than its value', () => {
      load([row()]);
      control().get('valueInPesos')!.setValue(82000);

      component.onAmountBlur(control());

      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(openSpy.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
        detail: 'Compra Coto', installmentLabel: '1/1', difference: 18000, symbol: '$', allowFixTotal: false, allowRevert: true
      }));
    });

    it('should allow fixing the total only when paying more in a single installment purchase', () => {
      load([row(), row({ cardTransactionId: 21, installment: '2/3' })]);
      control(0).get('valueInPesos')!.setValue(110000);
      control(1).get('valueInPesos')!.setValue(110000);

      component.onAmountBlur(control(0));
      component.onAmountBlur(control(1));

      expect(openSpy.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ difference: -10000, allowFixTotal: true }));
      expect(openSpy.calls.argsFor(1)[0]).toEqual(jasmine.objectContaining({ difference: -10000, allowFixTotal: false }));
    });

    it('should not ask when the installment is paid for its value or for a peso of difference', () => {
      load([row()]);

      component.onAmountBlur(control());
      control().get('valueInPesos')!.setValue(99999.5);
      component.onAmountBlur(control());

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should not ask for a blank or zero amount (that is an incomplete row, not a difference)', () => {
      load([row()]);

      control().get('valueInPesos')!.setValue('');
      component.onAmountBlur(control());
      control().get('valueInPesos')!.setValue(0);
      component.onAmountBlur(control());

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should not ask about a dollar purchase paid in pesos', () => {
      load([row({ assetId: 2, asset: 'Dolar Estadounidense', installmentAmount: 100, valueInPesos: 150000 })]);
      control().get('valueInPesos')!.setValue(140000);

      component.onAmountBlur(control());

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should compare in the own currency when paying pesos and dollars', () => {
      load([row({ assetId: 2, asset: 'Dolar Estadounidense', installmentAmount: 100, valueInPesos: 150000, installment: '1/1' })], 'Pesos+Dolar');
      control().get('installmentAmount')!.setValue(80);

      component.onAmountBlur(control());

      expect(openSpy.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ difference: 20, symbol: 'US$' }));
    });

    it('should use a cent as the threshold for dollars', () => {
      load([row({ assetId: 2, asset: 'Dolar Estadounidense', installmentAmount: 100, valueInPesos: 150000 })], 'Pesos+Dolar');

      control().get('installmentAmount')!.setValue(99.995);
      component.onAmountBlur(control());
      expect(openSpy).not.toHaveBeenCalled();

      control().get('installmentAmount')!.setValue(99.5);
      component.onAmountBlur(control());
      expect(openSpy).toHaveBeenCalledTimes(1);
    });

    it('should not ask about manual rows, recurring charges, rows that are not being paid or unknown payment mode', () => {
      load([row({ cardTransactionId: 0 }), row({ installment: 'Recurrente' }), row({ pay: false })]);
      component.cardTransactionsArray.at(0).get('isManual')!.setValue(true);
      control(2).get('pay')!.setValue(false);
      [0, 1, 2].forEach(i => control(i).get('valueInPesos')!.setValue(50000));

      [0, 1, 2].forEach(i => component.onAmountBlur(control(i)));
      component.selectedPaymentAssets = null;
      component.onAmountBlur(control(0));

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should not ask again for the same amount but should when it changes', () => {
      load([row()]);
      control().get('valueInPesos')!.setValue(82000);
      component.onAmountBlur(control());
      component.onDifferenceChosen({ kind: 'Discount' });
      openSpy.calls.reset();

      component.onAmountBlur(control());
      expect(openSpy).not.toHaveBeenCalled();

      control().get('valueInPesos')!.setValue(80000);
      component.onAmountBlur(control());
      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(component.differenceLabel(control())).toBeNull();
    });

    it('should forget the answer when the amount goes back to the value of the installment', () => {
      load([row()]);
      control().get('valueInPesos')!.setValue(82000);
      component.onAmountBlur(control());
      component.onDifferenceChosen({ kind: 'Discount' });

      control().get('valueInPesos')!.setValue(100000);
      component.onAmountBlur(control());

      expect(component.differenceLabel(control())).toBeNull();
    });

    it('should show what was answered under the amount', () => {
      load([row(), row({ cardTransactionId: 21 }), row({ cardTransactionId: 22 })]);
      [0, 1, 2].forEach(i => control(i).get('valueInPesos')!.setValue(82000));

      component.onAmountBlur(control(0));
      component.onDifferenceChosen({ kind: 'Discount' });
      component.onAmountBlur(control(1));
      component.onDifferenceChosen({ kind: 'People', people: [{ personId: 1, amount: 10000 }, { personId: 2, amount: 8000 }] });
      component.onAmountBlur(control(2));
      component.onDifferenceChosen({ kind: 'Later' });

      expect(component.differenceLabel(control(0))).toBe('Descuento del banco');
      expect(component.differenceLabel(control(1))).toBe('Parte de 2 personas');
      expect(component.differenceLabel(control(2))).toBe('Sin explicar');
      expect(component.differenceBadgeClass(control(0))).toBe('text-bg-success');
      expect(component.differenceBadgeClass(control(2))).toBe('text-bg-warning');
    });

    it('should put the value of the installment back when the user says it was a mistake', () => {
      load([row()]);
      control().get('valueInPesos')!.setValue(82000);
      component.onAmountBlur(control());

      component.onDifferenceChosen({ kind: 'Revert' });

      expect((component as any).parseAmount(control().get('valueInPesos')!.value)).toBe(100000);
      expect(component.differenceLabel(control())).toBeNull();
    });

    it('should forget the answers when the way of paying changes', () => {
      load([row()]);
      control().get('valueInPesos')!.setValue(82000);
      component.onAmountBlur(control());
      component.onDifferenceChosen({ kind: 'Discount' });

      component.updateEditOptions();

      expect(component.differenceLabel(control())).toBeNull();
    });

    describe('on submit', () => {
      beforeEach(() => {
        createSpy = spyOn((component as any).cardTransactionService, 'createCardPayment').and.returnValue(of({}));
        // Un pago que cubre las cuotas: si no, el formulario marca los gastos como "Datos Incorrectos" y no deja enviar.
        component.cardPaymentForm.patchValue({
          card: '4', account: '1', paymentAssets: 'Pesos', pesosPayment: '1000000', cardExpenses: '0',
          nextClosingDate: '2026-11-01', nextDueDate: '2026-11-13'
        }, { emitEvent: false });
      });

      const sentRow = (i = 0) => createSpy.calls.mostRecent().args[0].cardTransactions[i];

      it('should send the discount with the row', () => {
        load([row()]);
        control().get('valueInPesos')!.setValue(82000);
        component.onAmountBlur(control());
        component.onDifferenceChosen({ kind: 'Discount' });

        component.onSubmit();

        expect(createSpy).toHaveBeenCalledTimes(1);
        expect(sentRow().difference).toEqual({ kind: 'Discount' });
        expect(sentRow().valueInPesos).toBe(82000);
      });

      it('should send the people with their amounts', () => {
        load([row()]);
        control().get('valueInPesos')!.setValue(82000);
        component.onAmountBlur(control());
        component.onDifferenceChosen({ kind: 'People', people: [{ personId: 1, amount: 18000 }] });

        component.onSubmit();

        expect(sentRow().difference).toEqual({ kind: 'People', people: [{ personId: 1, amount: 18000 }] });
      });

      it('should send fixing the total', () => {
        load([row()]);
        control().get('valueInPesos')!.setValue(110000);
        component.onAmountBlur(control());
        component.onDifferenceChosen({ kind: 'FixTotal' });

        component.onSubmit();

        expect(sentRow().difference).toEqual({ kind: 'FixTotal' });
      });

      it('should send nothing for "later": the payment goes through and the purchase stays in the list of the ones that do not close', () => {
        load([row()]);
        control().get('valueInPesos')!.setValue(82000);
        component.onAmountBlur(control());
        component.onDifferenceChosen({ kind: 'Later' });

        component.onSubmit();

        expect(createSpy).toHaveBeenCalledTimes(1);
        expect(sentRow().difference).toBeUndefined();
      });

      it('should send nothing for a row that was not edited', () => {
        load([row()]);

        component.onSubmit();

        expect(sentRow().difference).toBeUndefined();
        expect(sentRow().valueInPesos).toBe(100000);
      });

      it('should drop an answer that no longer matches the amount (for example when submitting with Enter without leaving the field)', () => {
        load([row()]);
        control().get('valueInPesos')!.setValue(82000);
        component.onAmountBlur(control());
        component.onDifferenceChosen({ kind: 'Discount' });
        control().get('valueInPesos')!.setValue(70000);

        component.onSubmit();

        expect(sentRow().difference).toBeUndefined();
      });

      it('should send the explanation only for the rows that have one', () => {
        load([row(), row({ cardTransactionId: 21 })]);
        control(1).get('valueInPesos')!.setValue(90000);
        component.onAmountBlur(control(1));
        component.onDifferenceChosen({ kind: 'Discount' });

        component.onSubmit();

        expect(sentRow(0).difference).toBeUndefined();
        expect(sentRow(1).difference).toEqual({ kind: 'Discount' });
      });
    });
  });

});
