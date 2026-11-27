import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { CardTransactionsListComponent } from './card-transactions-list.component';
import { provideToastr } from 'ngx-toastr';

describe('CardTransactionsListComponent', () => {
  let component: CardTransactionsListComponent;
  let fixture: ComponentFixture<CardTransactionsListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule, CardTransactionsListComponent],
    providers: [provideToastr()],
    schemas: [NO_ERRORS_SCHEMA]
});
    fixture = TestBed.createComponent(CardTransactionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // plan-gastos-recurrentes.md, Fase 9
  it('links the purchases of a recurring expense to it, and only those', () => {
    component.isLoading = false;
    component.cardTransactions = [
      { id: 1, installments: 'Recurrente', recurringExpenseId: 7 },
      { id: 2, installments: '3', recurringExpenseId: null },
      { id: 3, installments: 'Recurrente' }
    ] as any;
    fixture.detectChanges();

    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a[title="Ver ficha"]');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toBe('/recurring-expenses/7');
  });
});
