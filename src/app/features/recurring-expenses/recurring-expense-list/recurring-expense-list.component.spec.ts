import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { RecurringExpenseListComponent } from './recurring-expense-list.component';
import { RecurringExpenseListItem } from '../models/recurring-expense.model';
import { listItem } from '../testing/recurring-expense.fixtures';

// plan-gastos-recurrentes.md, Fase 8 — la lista de fijos y suscripciones.
describe('RecurringExpenseListComponent', () => {
  let component: RecurringExpenseListComponent;
  let fixture: ComponentFixture<RecurringExpenseListComponent>;
  let http: HttpTestingController;

  const listUrl = (r: { url: string }) => r.url.endsWith('/api/RecurringExpense');

  function load(items: RecurringExpenseListItem[]): string {
    http.expectOne(listUrl).flush(items);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent!;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, RecurringExpenseListComponent],
      providers: [provideToastr(), provideNoopAnimations()]
    });
    fixture = TestBed.createComponent(RecurringExpenseListComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('separates the current ones from the cancelled ones, with what they cost and how the month is going', () => {
    const text = load([
      listItem(),
      listItem({ id: 2, name: 'Alquiler', source: 'ACCOUNT', cardName: null, accountName: 'Banco', expectedAmount: 500000, currentMonthState: 'Paid', currentMonthAmount: 510000 }),
      listItem({ id: 3, name: 'Claude', assetSymbol: 'USD', expectedAmount: 20, currentMonthState: null, currentMonthAmount: null }),
      listItem({ id: 4, name: 'Pedidos ya plus', isActive: false, endMonth: '2026-09-01T00:00:00' })
    ]);

    expect(component.active.map(i => i.id)).toEqual([1, 2, 3]);
    expect(component.cancelled.map(i => i.id)).toEqual([4]);
    expect(text).toContain('Vigentes');
    expect(text).toContain('Dados de baja');
    expect(text).toContain('$ 48.056,00');
    expect(text).toContain('US$ 20,00');
    expect(text).toContain('Banco');
    expect(text).toContain('Esperado');
    expect(text).toContain('Pagado');
    expect(text).toContain('$ 510.000,00');
    expect(text).toContain('No se espera');
    expect(text).toContain('septiembre 2026');
  });

  it('explains what to do when there is nothing yet', () => {
    expect(load([])).toContain('Todavía no cargaste ningún fijo ni suscripción');
    expect(component.isEmpty).toBeTrue();
  });

  it('offers to try again when the list cannot be loaded', () => {
    http.expectOne(listUrl).flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadFailed).toBeTrue();
    component.load();
    load([listItem()]);
    expect(component.loadFailed).toBeFalse();
  });
});
