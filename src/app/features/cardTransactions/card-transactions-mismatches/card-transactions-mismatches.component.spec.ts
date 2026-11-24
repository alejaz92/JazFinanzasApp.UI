import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideToastr } from 'ngx-toastr';

import { CardTransactionsMismatchesComponent } from './card-transactions-mismatches.component';
import { CardPurchaseMismatch } from '../models/card-purchase-mismatch.model';
import { ToastService } from 'src/app/core/services/toast.service';

// plan-repartos-y-descuentos-faltantes.md, Fase 8 — la pantalla de compras que no cierran.
describe('CardTransactionsMismatchesComponent', () => {
  let component: CardTransactionsMismatchesComponent;
  let fixture: ComponentFixture<CardTransactionsMismatchesComponent>;
  let http: HttpTestingController;
  let toast: ToastService;
  let originalBootstrap: any;

  // Una compra de Coto de una cuota, de 100.000, pagada en 82.000 y sin nada que lo explique.
  const underpaid = (overrides: Partial<CardPurchaseMismatch> = {}): CardPurchaseMismatch => ({
    cardTransactionId: 20, date: '2026-09-12T00:00:00', detail: 'Compra Coto', cardId: 4, cardName: 'Visa Supervielle', assetId: 1, assetSymbol: 'ARS',
    totalAmount: 100000, installments: 1, installmentAmount: 100000, paidInstallments: 1, paid: 82000, explained: 0, direction: 'Underpaid', difference: 18000,
    payments: [{ transactionId: 5001, date: '2026-10-01T00:00:00', amount: 82000 }],
    ...overrides
  });
  const overpaid = (overrides: Partial<CardPurchaseMismatch> = {}): CardPurchaseMismatch =>
    underpaid({ cardTransactionId: 21, detail: 'Empanadas', paid: 113170, direction: 'Overpaid', difference: 13170, ...overrides });

  const mismatchesUrl = (r: { url: string }) => r.url.endsWith('/api/CardTransaction/mismatches');

  function load(list: CardPurchaseMismatch[]): void {
    http.expectOne(mismatchesUrl).flush(list);
    fixture.detectChanges();
  }

  beforeEach(() => {
    // Otros specs reemplazan el global `bootstrap` con dobles y no lo restauran: este instala el suyo y deja el que había.
    originalBootstrap = (window as any).bootstrap;
    (window as any).bootstrap = { Modal: class { show() {} hide() {} } };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, CardTransactionsMismatchesComponent],
      providers: [provideToastr()]
    });
    fixture = TestBed.createComponent(CardTransactionsMismatchesComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
    // El diálogo pide las personas al abrirse la pantalla.
    http.match(r => r.url.endsWith('/api/person')).forEach(r => r.flush([{ id: 1, name: 'Franco', userId: 1 }]));
  });

  afterEach(() => {
    (window as any).bootstrap = originalBootstrap;
    http.verify();
  });

  it('should create and ask for the purchases that do not close', () => {
    expect(component).toBeTruthy();
    http.expectOne(mismatchesUrl).flush([]);
  });

  it('should list the purchases with their amounts and the counts of each kind', () => {
    load([underpaid(), underpaid({ cardTransactionId: 22, detail: 'Otra' }), overpaid()]);

    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(component.isLoading).toBeFalse();
    expect(text).toContain('Compra Coto');
    expect(text).toContain('Empanadas');
    expect(text).toContain('Visa Supervielle');
    expect(text).toContain('$ 18.000,00');
    expect(text).toContain('2 pagadas de menos');
    expect(text).toContain('1 pagadas de más');
    expect(component.underpaidCount).toBe(2);
    expect(component.overpaidCount).toBe(1);
  });

  it('should say that everything closes when there is nothing to explain', () => {
    load([]);

    expect((fixture.nativeElement as HTMLElement).textContent!).toContain('Todas tus compras con tarjeta cierran');
  });

  it('should show an error and let the user try again when the list cannot be loaded', () => {
    const errorSpy = spyOn(toast, 'error');
    http.expectOne(mismatchesUrl).flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.loadFailed).toBeTrue();
    expect(errorSpy).toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent!).toContain('Reintentar');

    component.load();
    http.expectOne(mismatchesUrl).flush([underpaid()]);
    expect(component.loadFailed).toBeFalse();
    expect(component.mismatches.length).toBe(1);
  });

  it('should show dollars with their symbol', () => {
    load([underpaid({ assetSymbol: 'USD', difference: 5, totalAmount: 50, paid: 45, installmentAmount: 50 })]);

    expect(component.symbolOf(component.mismatches[0])).toBe('US$');
    expect((fixture.nativeElement as HTMLElement).textContent!).toContain('US$ 5,00');
  });

  describe('what can be done with each purchase', () => {
    it('should let explain a purchase paid for less', () => {
      expect(component.canExplain(underpaid())).toBeTrue();
      expect(component.hint(underpaid())).toBeNull();
      http.expectOne(mismatchesUrl).flush([]);
    });

    it('should let fix the total only in a single installment purchase paid for more with nothing loaded', () => {
      expect(component.canFixTotal(overpaid())).toBeTrue();
      expect(component.canFixTotal(overpaid({ installments: 3, paidInstallments: 3 }))).toBeFalse();
      expect(component.canFixTotal(overpaid({ explained: 500 }))).toBeFalse();
      expect(component.canFixTotal(underpaid())).toBeFalse();
      http.expectOne(mismatchesUrl).flush([]);
    });

    it('should explain what to do when the purchase cannot be explained from here', () => {
      const withShare = overpaid({ explained: 500 });
      const many = overpaid({ installments: 3, paidInstallments: 3 });

      expect(component.canExplain(withShare)).toBeFalse();
      expect(component.hint(withShare)).toContain('Hay más reparto o descuento cargado');
      expect(component.hint(many)).toBe('Corregí la cuota.');
      http.expectOne(mismatchesUrl).flush([]);
    });

    it('should link to the edit of the installment when there is one, and offer each installment when there are several', () => {
      load([underpaid(), underpaid({
        cardTransactionId: 23, detail: 'Vuelos', installments: 3, paidInstallments: 2,
        payments: [{ transactionId: 6001, date: '2026-09-01T00:00:00', amount: 10 }, { transactionId: 6002, date: '2026-10-01T00:00:00', amount: 10 }]
      })]);

      const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')).map(a => a.getAttribute('href') ?? '');
      expect(links.some(h => h.includes('/transactions/5001') && h.includes('returnTo=%2FcardTransactions%2Fmismatches'))).toBeTrue();
      expect(links.some(h => h.includes('/transactions/6001'))).toBeTrue();
      expect(links.some(h => h.includes('/transactions/6002'))).toBeTrue();
      expect((fixture.nativeElement as HTMLElement).textContent!).toContain('Corregir una cuota');
    });
  });

  describe('explaining a purchase', () => {
    let openSpy: jasmine.Spy;

    beforeEach(() => {
      load([underpaid(), overpaid(), overpaid({ cardTransactionId: 24, explained: 500 })]);
      openSpy = spyOn(component.differenceDialog!, 'open');
    });

    it('should open the dialog with the difference of the whole purchase', () => {
      component.explain(component.mismatches[0]);

      const context = openSpy.calls.mostRecent().args[0];
      expect(context).toEqual(jasmine.objectContaining({
        detail: 'Compra Coto', title: 'Se pagó de menos', difference: 18000, symbol: '$', allowFixTotal: false, allowRevert: false
      }));
      expect(context.summary).toContain('$ 18.000,00 menos');
    });

    it('should open the dialog for a purchase paid for more with a negative difference and the option to fix the total', () => {
      component.explain(component.mismatches[1]);

      expect(openSpy.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ title: 'Se pagó de más', difference: -13170, allowFixTotal: true }));
    });

    it('should not open the dialog for a purchase that cannot be explained from here', () => {
      component.explain(component.mismatches[2]);

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should send the discount, tell the user and reload the list', () => {
      const successSpy = spyOn(toast, 'success');
      component.explain(component.mismatches[0]);

      component.onDifferenceChosen({ kind: 'Discount' });

      const request = http.expectOne(r => r.url.endsWith('/api/CardTransaction/20/difference'));
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ kind: 'Discount' });
      expect(component.isSaving).toBeTrue();
      request.flush(null);

      expect(successSpy).toHaveBeenCalled();
      http.expectOne(mismatchesUrl).flush([overpaid()]);
      expect(component.isSaving).toBeFalse();
      expect(component.mismatches.length).toBe(1);
    });

    it('should send the people with their amounts', () => {
      component.explain(component.mismatches[0]);

      component.onDifferenceChosen({ kind: 'People', people: [{ personId: 1, amount: 10000 }, { personId: 2, amount: 8000 }] });

      const request = http.expectOne(r => r.url.endsWith('/api/CardTransaction/20/difference'));
      expect(request.request.body).toEqual({ kind: 'People', people: [{ personId: 1, amount: 10000 }, { personId: 2, amount: 8000 }] });
      request.flush(null);
      http.expectOne(mismatchesUrl).flush([]);
    });

    it('should send fixing the total', () => {
      component.explain(component.mismatches[1]);

      component.onDifferenceChosen({ kind: 'FixTotal' });

      const request = http.expectOne(r => r.url.endsWith('/api/CardTransaction/21/difference'));
      expect(request.request.body).toEqual({ kind: 'FixTotal' });
      request.flush(null);
      http.expectOne(mismatchesUrl).flush([]);
    });

    it('should send nothing when the user says "later" or closes the dialog', () => {
      component.explain(component.mismatches[0]);

      component.onDifferenceChosen({ kind: 'Later' });

      http.expectNone(r => r.url.endsWith('/difference'));
      expect(component.isSaving).toBeFalse();
      expect(component.mismatches.length).toBe(3);
    });

    it('should show the message of the backend when it rejects the explanation, and keep the list', () => {
      const errorSpy = spyOn(toast, 'error');
      component.explain(component.mismatches[0]);
      component.onDifferenceChosen({ kind: 'Discount' });

      http.expectOne(r => r.url.endsWith('/api/CardTransaction/20/difference'))
        .flush({ statusCode: 400, error: 'Bad Request', message: 'Esta compra no tiene ninguna diferencia sin explicar' }, { status: 400, statusText: 'Bad Request' });

      expect(errorSpy).toHaveBeenCalledWith('Esta compra no tiene ninguna diferencia sin explicar');
      expect(component.isSaving).toBeFalse();
      expect(component.mismatches.length).toBe(3);
    });

    it('should not open another explanation while one is being saved', () => {
      component.explain(component.mismatches[0]);
      component.onDifferenceChosen({ kind: 'Discount' });
      openSpy.calls.reset();

      component.explain(component.mismatches[1]);

      expect(openSpy).not.toHaveBeenCalled();
      http.expectOne(r => r.url.endsWith('/api/CardTransaction/20/difference')).flush(null);
      http.expectOne(mismatchesUrl).flush([]);
    });
  });
});
