import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA, importProvidersFrom } from '@angular/core';
import { ToastrModule } from 'ngx-toastr';

import { CardTransactionsAddComponent } from './card-transactions-add.component';

describe('CardTransactionsAddComponent', () => {
  let component: CardTransactionsAddComponent;
  let fixture: ComponentFixture<CardTransactionsAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule, CardTransactionsAddComponent],
    providers: [importProvidersFrom(ToastrModule.forRoot())],
    schemas: [NO_ERRORS_SCHEMA]
});
    fixture = TestBed.createComponent(CardTransactionsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Cubre el bug real encontrado en producción: con un cierre propio cargado, el gasto y el
  // cierre pueden caer en meses distintos (a diferencia del fallback getLastThursday, que
  // siempre cae en el mismo mes que el gasto) — el mes de la cuota debe basarse en el mes
  // del CIERRE, no en el mes del gasto.
  describe('assignFirstInstallment', () => {
    beforeEach(() => {
      component.cards = [
        { id: 1, name: 'Con cierre propio', nextClosingDate: '2026-08-18T00:00:00', nextDueDate: '2026-08-24T00:00:00' },
        { id: 2, name: 'Sin cierre cargado', nextClosingDate: null, nextDueDate: null }
      ];
    });

    it('should assign the CLOSING month when the expense date is before the closing date, even in a different calendar month', () => {
      component.cardTransactionForm.controls['card'].setValue('1');
      component.cardTransactionForm.controls['date'].setValue('2026-07-26');
      component.assignFirstInstallment();
      expect(component.cardTransactionForm.controls['firstInstallmentDate'].value).toBe('2026-08');
    });

    it('should assign the month after the closing month when the expense date is after the closing date', () => {
      component.cardTransactionForm.controls['card'].setValue('1');
      component.cardTransactionForm.controls['date'].setValue('2026-08-19');
      component.assignFirstInstallment();
      expect(component.cardTransactionForm.controls['firstInstallmentDate'].value).toBe('2026-09');
    });

    it('should fall back to getLastThursday when the card has no nextClosingDate loaded', () => {
      component.cardTransactionForm.controls['card'].setValue('2');
      component.cardTransactionForm.controls['date'].setValue('2026-09-10'); // antes del ultimo jueves (24/09/2026)
      component.assignFirstInstallment();
      expect(component.cardTransactionForm.controls['firstInstallmentDate'].value).toBe('2026-09');
    });

    it('should recalculate correctly when the date is set BEFORE selecting the card (order-independent)', () => {
      component.cardTransactionForm.controls['date'].setValue('2026-07-26');
      component.assignFirstInstallment(); // dispara con (change) del input de fecha, sin tarjeta aun -> fallback (sin tarjeta seleccionada, cards.find no encuentra nada)

      component.cardTransactionForm.controls['card'].setValue('1');
      component.assignFirstInstallment(); // dispara con (change) del select de tarjeta

      expect(component.cardTransactionForm.controls['firstInstallmentDate'].value).toBe('2026-08');
    });

    it('should do nothing when the card changes before any date is set', () => {
      component.cardTransactionForm.controls['card'].setValue('1');
      component.assignFirstInstallment();
      expect(component.cardTransactionForm.controls['firstInstallmentDate'].value).toBe('');
    });
  });
});
