import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { RecurringExpenseDetailComponent } from './recurring-expense-detail.component';
import { ToastService } from 'src/app/core/services/toast.service';
import { RecurringExpenseDetail } from '../models/recurring-expense.model';
import { accountDetail, detail, month, payment } from '../testing/recurring-expense.fixtures';

// plan-gastos-recurrentes.md, Fase 8 — la ficha y sus acciones.
describe('RecurringExpenseDetailComponent', () => {
  let component: RecurringExpenseDetailComponent;
  let fixture: ComponentFixture<RecurringExpenseDetailComponent>;
  let http: HttpTestingController;
  let toast: ToastService;
  let router: Router;
  let originalBootstrap: any;
  let current: RecurringExpenseDetail;

  const api = (path: string) => (r: { url: string }) => r.url.endsWith(`/api/RecurringExpense${path}`);
  const text = () => (fixture.nativeElement as HTMLElement).textContent!;
  const buttons = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).map(b => b.textContent!.trim());

  function setup(expense: RecurringExpenseDetail): void {
    current = expense;
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, RecurringExpenseDetailComponent],
      providers: [
        provideToastr(),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: String(expense.id) }), queryParamMap: convertToParamMap({}) } } }
      ]
    });
    fixture = TestBed.createComponent(RecurringExpenseDetailComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    http.expectOne(api(`/${expense.id}`)).flush(expense);
    http.expectOne(r => r.url.endsWith('/api/card')).flush([{ id: 10, name: 'Visa' }, { id: 11, name: 'Master' }]);
    http.expectOne(r => r.url.endsWith('/api/account/ByAssetType/Moneda')).flush([{ id: 20, name: 'Banco' }, { id: 21, name: 'Billetera' }]);
    fixture.detectChanges();
  }

  // El pedido de una acción: se contesta bien y la ficha se vuelve a pedir.
  function expectAction(method: string, path: string): TestRequest {
    const request = http.expectOne(r => r.method === method && api(path)(r));
    return request;
  }

  function accept(request: TestRequest): void {
    request.flush(null);
    http.expectOne(r => r.method === 'GET' && api(`/${current.id}`)(r)).flush(current);
    fixture.detectChanges();
  }

  beforeEach(() => {
    originalBootstrap = (window as any).bootstrap;
    (window as any).bootstrap = { Modal: class { show() {} hide() {} } };
  });

  afterEach(() => {
    (window as any).bootstrap = originalBootstrap;
    http.verify();
  });

  it('tells the story month by month, newest first, with estimates, moved and converted payments', () => {
    setup(detail({
      months: [
        month({ month: '2026-08-01T00:00:00', state: 'Paid', amount: 12.5, isEstimate: false, converted: true,
          payments: [payment({ converted: true, nativeAmount: 18000, chargedEarly: true, date: '2026-07-01T00:00:00' })] }),
        month({ month: '2026-09-01T00:00:00', state: 'NoCharge', amount: 0, isEstimate: false, exceptionStatus: 'NO_CHARGE' }),
        month()
      ]
    }));

    expect(component.history.map(m => m.month.substring(0, 7))).toEqual(['2026-10', '2026-09', '2026-08']);
    expect(text()).toContain('estimado');
    expect(text()).toContain('convertido');
    expect(text()).toContain('adelantado');
    expect(text()).toContain('Resumen de julio 2026');
    expect(text()).toContain('$ 18.000,00');
    expect(text()).toContain('Marcado sin cargo');
  });

  it('offers what applies to a card subscription with payments', () => {
    setup(detail());

    expect(buttons()).toContain('Dar de baja');
    expect(buttons()).toContain('Asociar una compra');
    expect(buttons()).not.toContain('Registrar un pago');
    expect(buttons()).not.toContain('Asociar un egreso');
    // It has payments: it cannot be deleted.
    expect(buttons()).not.toContain('Borrar');
    // A card month admits the three marks.
    expect(buttons()).toContain('Atrasado');
  });

  it('offers what applies to an account expense without payments', () => {
    setup(accountDetail());

    expect(buttons()).toContain('Registrar un pago');
    expect(buttons()).toContain('Asociar un egreso');
    expect(buttons()).toContain('Borrar');
    expect(buttons()).toContain('Sin cargo');
    expect(buttons()).not.toContain('Atrasado');
  });

  it('only offers to sign up again when it is cancelled', () => {
    setup(detail({ isActive: false, endMonth: '2026-09-01T00:00:00' }));

    expect(buttons()).toContain('Volver a contratar');
    expect(buttons()).not.toContain('Dar de baja');
    expect(buttons()).not.toContain('Cambiar tarjeta o cuenta');

    component.open('reactivate');
    expect(component.form.month >= '2026-10').toBeTrue();
  });

  it('registers a payment with the expected amount and the account of the expense', () => {
    setup(accountDetail());
    component.open('register');
    expect(component.form.amount).toBe(500000);
    component.form.month = '2026-10';
    component.form.date = '2026-10-09';
    component.form.amount = '510.000,00';

    component.submitPayment();

    const request = expectAction('POST', '/2/payments');
    expect(request.request.body).toEqual({ month: '2026-10-01', date: '2026-10-09', amount: 510000, accountId: 20, detail: 'Alquiler' });
    accept(request);
    expect(component.panel).toBeNull();
  });

  it('keeps the panel open and shows the reason when an action is rejected', () => {
    setup(accountDetail());
    spyOn(toast, 'error');
    component.open('register');

    component.submitPayment();
    expectAction('POST', '/2/payments').flush({ message: 'No hay suficiente saldo en la cuenta' }, { status: 400, statusText: 'Bad Request' });

    expect(toast.error).toHaveBeenCalledWith('No hay suficiente saldo en la cuenta');
    expect(component.panel).toBe('register');
    expect(component.isSaving).toBeFalse();
  });

  it('changes the card from a month', () => {
    setup(detail());
    component.open('source');
    component.form.cardId = 11;
    component.form.month = '2026-11';

    component.submitSource();

    const request = expectAction('PUT', '/1/source');
    expect(request.request.body).toEqual({ source: 'CARD', cardId: 11, accountId: null, frequency: null, fromMonth: '2026-11-01' });
    accept(request);
  });

  it('does not ask for a month between two accounts', () => {
    setup(accountDetail());
    component.open('source');
    component.form.accountId = 21;
    expect(component.asksFromMonth).toBeFalse();

    component.submitSource();

    const request = expectAction('PUT', '/2/source');
    expect(request.request.body).toEqual({ source: 'ACCOUNT', cardId: null, accountId: 21, frequency: 'MONTHLY', fromMonth: null });
    accept(request);
  });

  it('cancels from a month and signs up again', () => {
    setup(detail());
    component.open('cancel');
    component.form.month = '2026-11';
    component.submitCancel();
    const cancel = expectAction('POST', '/1/cancel');
    expect(cancel.request.body).toEqual({ month: '2026-11-01' });
    accept(cancel);

    component.open('reactivate');
    component.form.month = '2027-01';
    component.submitReactivate();
    const again = expectAction('POST', '/1/reactivate');
    expect(again.request.body).toEqual({ month: '2027-01-01', source: 'CARD', cardId: 10, accountId: null, frequency: null, expectedAmount: null });
    accept(again);
  });

  it('links an expense already loaded, searching again when the month changes', () => {
    setup(accountDetail());
    component.open('linkPayment');
    http.expectOne(r => r.url.includes('/2/payments/candidates')).flush([]);

    component.form.month = '2026-09';
    component.onSearchMonthChange();
    const search = http.expectOne(r => r.url.endsWith('/2/payments/candidates?month=2026-09-01'));
    search.flush([{ transactionId: 900, date: '2026-09-08T00:00:00', amount: 490000, assetSymbol: 'ARS', detail: 'Alquiler sept' }]);
    fixture.detectChanges();
    expect(text()).toContain('Alquiler sept');

    component.linkPayment(component.paymentCandidates![0]);

    const request = expectAction('PUT', '/2/payments/900');
    expect(request.request.body).toEqual({ month: '2026-09-01' });
    accept(request);
  });

  it('links a card purchase', () => {
    setup(detail());
    component.open('linkPurchase');
    http.expectOne(r => r.url.includes('/1/purchases/candidates')).flush([{
      cardTransactionId: 77, date: '2026-10-04T00:00:00', firstInstallment: '2026-10-01T00:00:00', cardName: 'Visa', detail: 'Internet mes siguiente',
      totalAmount: 47000, assetSymbol: 'ARS', installments: 1, paidInstallments: 0
    }]);
    fixture.detectChanges();
    expect(text()).toContain('0/1 pagadas');

    component.linkPurchase(component.purchaseCandidates![0]);

    accept(expectAction('PUT', '/1/purchases/77'));
  });

  it('moves a payment to another month', () => {
    setup(detail());
    component.startMove(component.expense!.months[0], component.expense!.months[0].payments[0]);
    expect(component.moveMonth).toBe('2026-09');
    component.moveMonth = '2026-08';

    component.confirmMove();

    const request = expectAction('PUT', '/1/payments/500/month');
    expect(request.request.body).toEqual({ month: '2026-08-01' });
    accept(request);
    expect(component.movingPaymentId).toBeNull();
  });

  it('marks a month and clears the mark', () => {
    setup(detail());
    const october = component.expense!.months[1];

    component.mark(october, 'DEFERRED');
    const mark = expectAction('PUT', '/1/months');
    expect(mark.request.body).toEqual({ month: '2026-10-01', status: 'DEFERRED' });
    accept(mark);

    component.mark(october, null);
    const clear = expectAction('PUT', '/1/months');
    expect(clear.request.body).toEqual({ month: '2026-10-01', status: null });
    accept(clear);
  });

  it('only unlinks after confirming', () => {
    setup(detail());

    component.askUnlink(component.expense!.months[0].payments[0]);
    http.expectNone(r => r.method === 'DELETE');
    expect(component.confirmMessage).toContain('queda como una compra común');

    component.onConfirmed();
    accept(expectAction('DELETE', '/1/payments/500'));
  });

  it('deletes after confirming and goes back to the list', () => {
    setup(accountDetail());

    component.askDelete();
    component.onConfirmed();
    expectAction('DELETE', '/2').flush(null);

    expect(router.navigate).toHaveBeenCalledWith(['/recurring-expenses']);
  });
});
