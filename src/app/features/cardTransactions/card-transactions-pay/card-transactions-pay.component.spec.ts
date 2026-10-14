import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideToastr } from 'ngx-toastr';

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
});
