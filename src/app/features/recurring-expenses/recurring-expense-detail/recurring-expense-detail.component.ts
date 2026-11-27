import { Component, OnInit, ViewChild } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { LoadingComponent } from 'src/app/core/components/loading/loading.component';
import { ToastService } from 'src/app/core/services/toast.service';
import { BackButtonComponent } from 'src/app/shared/components/back-button/back-button.component';
import { ConfirmModalComponent } from 'src/app/shared/components/confirm-modal/confirm-modal.component';
import { CurrencyInputDirective } from 'src/app/shared/directives/currency-input.directive';
import { CurrencyFiatFormatPipe } from 'src/app/shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { AccountService } from 'src/app/features/account/services/account.service';
import { CardService } from 'src/app/features/card/services/card.service';
import { RecurringExpensesService } from '../services/recurring-expense.service';
import {
  RecurringExpenseDetail, RecurringExpenseMonth, RecurringExpensePayment, RecurringFrequency, RecurringMonthMark, RecurringPaymentCandidate,
  RecurringPurchaseCandidate, RecurringSource
} from '../models/recurring-expense.model';
import {
  currencySymbol, dateValue, FREQUENCY_LABELS, MARK_LABELS, monthLabel, monthToApi, monthValue, nextMonthValue, parseAmount, STATE_BADGES,
  STATE_LABELS
} from '../utils/recurring-expense.utils';

export type DetailPanel = 'source' | 'reactivate' | 'cancel' | 'register' | 'linkPayment' | 'linkPurchase';

interface Option {
  id: number;
  name: string;
}

// La ficha de un fijo o suscripción: sus datos, lo que costó mes a mes y todo lo que se puede hacer con ella
// (plan-gastos-recurrentes.md, D6, D7 y Fase 8). Ninguna acción sobre un movimiento ya cargado cambia su monto, su cuenta ni su fecha.
@Component({
  selector: 'app-recurring-expense-detail',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, FormsModule, RouterLink, LoadingComponent, BackButtonComponent, ConfirmModalComponent,
    CurrencyInputDirective, CurrencyFiatFormatPipe],
  templateUrl: './recurring-expense-detail.component.html'
})
export class RecurringExpenseDetailComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  loadFailed = false;
  id = 0;
  expense: RecurringExpenseDetail | null = null;
  // Los meses, del más nuevo al más viejo.
  history: RecurringExpenseMonth[] = [];
  cards: Option[] = [];
  accounts: Option[] = [];

  panel: DetailPanel | null = null;
  // Lo que se completa en el panel abierto. Los meses con el formato de <input type="month">.
  form = {
    source: 'CARD' as RecurringSource,
    cardId: null as number | null,
    accountId: null as number | null,
    frequency: 'MONTHLY' as RecurringFrequency,
    month: '',
    date: '',
    amount: '' as string | number,
    detail: ''
  };

  paymentCandidates: RecurringPaymentCandidate[] | null = null;
  purchaseCandidates: RecurringPurchaseCandidate[] | null = null;

  // El cobro que se está moviendo y a qué mes.
  movingPaymentId: number | null = null;
  moveMonth = '';

  confirmTitle = '';
  confirmMessage = '';
  private confirmed: (() => void) | null = null;
  @ViewChild('confirmModal') confirmModal?: ConfirmModalComponent;

  readonly monthLabel = monthLabel;
  readonly symbolOf = currencySymbol;
  readonly stateLabels = STATE_LABELS;
  readonly stateBadges = STATE_BADGES;
  readonly markLabels = MARK_LABELS;
  readonly frequencyLabels = FREQUENCY_LABELS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recurringExpenses: RecurringExpensesService,
    private cardService: CardService,
    private accountService: AccountService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
    (this.cardService.getAllCards() as Observable<any>).subscribe((cards: Option[]) => this.cards = cards);
    (this.accountService.getAccountByTypeName('Moneda') as Observable<any>).subscribe((accounts: Option[]) => this.accounts = accounts);
  }

  load(): void {
    this.recurringExpenses.getById(this.id).subscribe({
      next: (expense) => {
        this.expense = expense;
        this.history = [...expense.months].reverse();
        this.loadFailed = false;
        this.isLoading = false;
        this.isSaving = false;
      },
      error: () => {
        this.loadFailed = true;
        this.isLoading = false;
        this.isSaving = false;
        this.toastService.error('No se pudo cargar la ficha');
      }
    });
  }

  get symbol(): string {
    return currencySymbol(this.expense?.assetSymbol ?? '');
  }

  get paidWith(): string {
    if (!this.expense) return '';
    return (this.expense.source === 'CARD' ? this.expense.cardName : this.expense.accountName) ?? '';
  }

  get isAccount(): boolean {
    return this.expense?.source === 'ACCOUNT';
  }

  // Entre dos cuentas no hay períodos que partir: no se pregunta desde qué mes.
  get asksFromMonth(): boolean {
    return !(this.expense?.source === 'ACCOUNT' && this.form.source === 'ACCOUNT');
  }

  // ── Paneles ─────────────────────────────────────────────────────────────────

  open(panel: DetailPanel): void {
    const expense = this.expense;
    if (!expense) return;
    if (this.panel === panel) {
      this.close();
      return;
    }

    const today = new Date();
    const currentMonth = monthValue(today);
    const afterEnd = expense.endMonth ? nextMonthValue(expense.endMonth) : currentMonth;

    this.panel = panel;
    this.movingPaymentId = null;
    this.paymentCandidates = null;
    this.purchaseCandidates = null;
    this.form = {
      source: expense.source,
      cardId: expense.cardId,
      accountId: expense.accountId,
      frequency: expense.frequency,
      month: panel === 'reactivate' && afterEnd > currentMonth ? afterEnd : currentMonth,
      date: dateValue(today),
      amount: panel === 'register' ? expense.expectedAmount : '',
      detail: expense.name
    };

    if (panel === 'linkPayment' || panel === 'linkPurchase') this.search();
  }

  close(): void {
    this.panel = null;
  }

  submitSource(): void {
    if (!this.validSource()) return;
    if (this.asksFromMonth && !this.requireMonth()) return;

    const card = this.form.source === 'CARD';
    this.run(this.recurringExpenses.changeSource(this.id, {
      source: this.form.source,
      cardId: card ? this.form.cardId : null,
      accountId: card ? null : this.form.accountId,
      frequency: card ? null : this.form.frequency,
      fromMonth: this.asksFromMonth ? monthToApi(this.form.month) : null
    }), 'Se cambió con qué se paga');
  }

  submitReactivate(): void {
    if (!this.validSource() || !this.requireMonth()) return;

    const amount = this.form.amount === '' ? null : parseAmount(this.form.amount);
    if (amount !== null && !(amount > 0)) {
      this.toastService.error('El monto esperado tiene que ser mayor que cero.');
      return;
    }

    const card = this.form.source === 'CARD';
    this.run(this.recurringExpenses.reactivate(this.id, {
      month: monthToApi(this.form.month),
      source: this.form.source,
      cardId: card ? this.form.cardId : null,
      accountId: card ? null : this.form.accountId,
      frequency: card ? null : this.form.frequency,
      expectedAmount: amount
    }), 'Quedó vigente otra vez');
  }

  submitCancel(): void {
    if (!this.requireMonth()) return;
    this.run(this.recurringExpenses.cancel(this.id, monthToApi(this.form.month)), 'Se dio de baja');
  }

  submitPayment(): void {
    if (!this.requireMonth()) return;
    const amount = parseAmount(this.form.amount);
    if (!(amount > 0)) {
      this.toastService.error('El monto tiene que ser mayor que cero.');
      return;
    }
    if (!this.form.date) {
      this.toastService.error('Indicá la fecha del pago.');
      return;
    }

    this.run(this.recurringExpenses.registerPayment(this.id, {
      month: monthToApi(this.form.month),
      date: this.form.date,
      amount,
      accountId: this.form.accountId,
      detail: this.form.detail.trim() || null
    }), 'El pago quedó registrado');
  }

  private validSource(): boolean {
    if (this.form.source === 'CARD' && !this.form.cardId) {
      this.toastService.error('Elegí la tarjeta.');
      return false;
    }
    if (this.form.source === 'ACCOUNT' && !this.form.accountId) {
      this.toastService.error('Elegí la cuenta.');
      return false;
    }
    return true;
  }

  private requireMonth(): boolean {
    if (this.form.month) return true;
    this.toastService.error('Indicá el mes.');
    return false;
  }

  // ── Asociar ─────────────────────────────────────────────────────────────────

  search(): void {
    if (!this.requireMonth()) return;
    const month = monthToApi(this.form.month);
    const failed = (error: any) => this.toastService.error(error?.error?.message ?? 'No se pudo buscar');

    if (this.panel === 'linkPayment') {
      this.paymentCandidates = null;
      this.recurringExpenses.getPaymentCandidates(this.id, month).subscribe({ next: (found) => this.paymentCandidates = found, error: failed });
    } else {
      this.purchaseCandidates = null;
      this.recurringExpenses.getPurchaseCandidates(this.id, month).subscribe({ next: (found) => this.purchaseCandidates = found, error: failed });
    }
  }

  // Cambiar el mes deja viejo lo encontrado.
  onSearchMonthChange(): void {
    if (this.form.month) this.search();
  }

  linkPayment(candidate: RecurringPaymentCandidate): void {
    if (!this.requireMonth()) return;
    this.run(this.recurringExpenses.linkPayment(this.id, candidate.transactionId, monthToApi(this.form.month)), 'El egreso quedó asociado');
  }

  linkPurchase(candidate: RecurringPurchaseCandidate): void {
    this.run(this.recurringExpenses.linkPurchase(this.id, candidate.cardTransactionId), 'La compra quedó asociada');
  }

  // ── Corregir un mes ─────────────────────────────────────────────────────────

  // Los meses que se pagan con tarjeta admiten "atrasado" y "pendiente"; los de cuenta, solo "sin cargo".
  isCardMonth(month: RecurringExpenseMonth): boolean {
    return month.cardId !== null;
  }

  mark(month: RecurringExpenseMonth, status: RecurringMonthMark | null): void {
    this.run(this.recurringExpenses.setMonthStatus(this.id, monthToApi(month.month), status),
      status ? 'El mes quedó marcado' : 'Se quitó la marca');
  }

  startMove(month: RecurringExpenseMonth, payment: RecurringExpensePayment): void {
    this.movingPaymentId = payment.transactionId;
    this.moveMonth = monthValue(month.month);
  }

  confirmMove(): void {
    const paymentId = this.movingPaymentId;
    if (paymentId === null) return;
    if (!this.moveMonth) {
      this.toastService.error('Indicá el mes.');
      return;
    }
    this.run(this.recurringExpenses.movePayment(this.id, paymentId, monthToApi(this.moveMonth)), 'El cobro se movió');
  }

  askUnlink(payment: RecurringExpensePayment): void {
    const card = payment.cardId !== null;
    this.ask('Desvincular el cobro',
      card
        ? 'La cuota deja de ser de esta ficha y queda como una compra común. Si venía de una compra suelta con varias cuotas, salen todas. No cambia ningún saldo.'
        : 'El egreso deja de ser de esta ficha. El movimiento queda igual y no cambia ningún saldo.',
      () => this.run(this.recurringExpenses.unlinkPayment(this.id, payment.transactionId), 'El cobro se desvinculó'));
  }

  askDelete(): void {
    this.ask('Borrar la ficha', `¿Borrar «${this.expense?.name}»? No se puede deshacer.`, () => {
      this.isSaving = true;
      this.recurringExpenses.delete(this.id).subscribe({
        next: () => {
          this.toastService.success('La ficha se borró');
          this.router.navigate(['/recurring-expenses']);
        },
        error: (error) => this.failed(error)
      });
    });
  }

  private ask(title: string, message: string, action: () => void): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmed = action;
    this.confirmModal?.open();
  }

  onConfirmed(): void {
    const action = this.confirmed;
    this.confirmed = null;
    action?.();
  }

  // Toda acción: se guarda, se cierra lo abierto y se vuelve a pedir la ficha, que es la que dice cómo quedó.
  private run(request: Observable<unknown>, message: string): void {
    if (this.isSaving) return;
    this.isSaving = true;
    request.subscribe({
      next: () => {
        this.toastService.success(message);
        this.panel = null;
        this.movingPaymentId = null;
        this.load();
      },
      error: (error) => this.failed(error)
    });
  }

  private failed(error: any): void {
    this.isSaving = false;
    this.toastService.error(error?.error?.message ?? 'No se pudo completar la acción');
  }
}
