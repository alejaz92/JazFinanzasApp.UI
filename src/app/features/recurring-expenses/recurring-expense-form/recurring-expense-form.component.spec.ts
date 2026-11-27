import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { RecurringExpenseFormComponent } from './recurring-expense-form.component';
import { ToastService } from 'src/app/core/services/toast.service';
import { RecurringExpenseDetail } from '../models/recurring-expense.model';
import { detail } from '../testing/recurring-expense.fixtures';

// plan-gastos-recurrentes.md, Fase 8 — alta y edición de un fijo o suscripción.
describe('RecurringExpenseFormComponent', () => {
  let component: RecurringExpenseFormComponent;
  let fixture: ComponentFixture<RecurringExpenseFormComponent>;
  let http: HttpTestingController;
  let toast: ToastService;
  let router: Router;

  const ends = (path: string) => (r: { url: string }) => r.url.toLowerCase().endsWith(path.toLowerCase());

  function setup(id: string | null, existing?: RecurringExpenseDetail): void {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, RecurringExpenseFormComponent],
      providers: [
        provideToastr(),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}), queryParamMap: convertToParamMap({}) } } }
      ]
    });
    fixture = TestBed.createComponent(RecurringExpenseFormComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();

    if (existing) http.expectOne(ends(`/api/RecurringExpense/${existing.id}`)).flush(existing);
    http.expectOne(r => r.url.toLowerCase().endsWith('/api/transactionclass')).flush([
      { id: 30, description: 'Servicios', incExp: 'E' }, { id: 32, description: 'Sueldo', incExp: 'I' }
    ]);
    http.expectOne(ends('/api/card')).flush([{ id: 10, name: 'Visa' }]);
    http.expectOne(ends('/api/account/ByAssetType/Moneda')).flush([{ id: 20, name: 'Banco' }]);
    http.expectOne(ends('/api/asset/card')).flush([{ id: 1, name: 'Peso Argentino' }, { id: 2, name: 'Dolar Estadounidense' }]);
    http.expectOne(ends('/api/asset/user-assetsByName/Moneda')).flush([{ id: 1, name: 'Peso Argentino' }, { id: 3, name: 'Euro' }]);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('offers only expense categories and the currencies of what it is paid with', () => {
    setup(null);

    expect(component.categories.map(c => c.name)).toEqual(['Servicios']);
    expect(component.currencies.map(c => c.id)).toEqual([1, 2]);

    component.form.patchValue({ assetId: 2 });
    component.form.get('source')!.setValue('ACCOUNT');

    expect(component.currencies.map(c => c.id)).toEqual([1, 3]);
    // Dollars were not among the currencies of the account.
    expect(component.form.get('assetId')!.value).toBeNull();
  });

  it('creates a card subscription as monthly and goes to it', () => {
    setup(null);
    component.form.patchValue({
      name: ' Internet ', transactionClassId: 30, cardId: 10, accountId: 20, assetId: 1, frequency: 'BIMONTHLY', startMonth: '2026-09',
      expectedAmount: '48.056,50', notes: ''
    });

    component.onSubmit();

    const request = http.expectOne(ends('/api/RecurringExpense'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Internet', transactionClassId: 30, assetId: 1, source: 'CARD', cardId: 10, accountId: null, frequency: 'MONTHLY',
      startMonth: '2026-09-01', expectedAmount: 48056.5, notes: null
    });
    request.flush({ id: 7 });
    expect(router.navigate).toHaveBeenCalledWith(['/recurring-expenses', 7]);
  });

  it('asks for what is missing without calling the server', () => {
    setup(null);
    spyOn(toast, 'error');

    component.onSubmit();
    expect(toast.error).toHaveBeenCalledWith('Escribí un nombre.');

    component.form.patchValue({ name: 'Gas', transactionClassId: 30, cardId: 10, assetId: 1, expectedAmount: '0' });
    component.onSubmit();
    expect(toast.error).toHaveBeenCalledWith('El monto esperado tiene que ser mayor que cero.');
  });

  it('with payments it locks the currency and the expected amount, and sends the amount as untouched', () => {
    setup('1', detail());

    expect(component.isEdit).toBeTrue();
    expect(component.form.get('assetId')!.disabled).toBeTrue();
    expect(component.form.get('expectedAmount')!.disabled).toBeTrue();
    component.form.patchValue({ name: 'Fibra' });
    component.onSubmit();

    const request = http.expectOne(ends('/api/RecurringExpense/1'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ name: 'Fibra', transactionClassId: 30, assetId: 1, frequency: 'MONTHLY', expectedAmount: null, notes: null });
    request.flush(null);
  });

  it('shows the reason when the server rejects it and lets try again', () => {
    setup('1', detail({ hasPayments: false }));
    spyOn(toast, 'error');

    component.onSubmit();
    http.expectOne(ends('/api/RecurringExpense/1')).flush({ message: 'La categoría tiene que ser de egreso.' }, { status: 400, statusText: 'Bad Request' });

    expect(toast.error).toHaveBeenCalledWith('La categoría tiene que ser de egreso.');
    expect(component.isSubmitting).toBeFalse();
  });
});
