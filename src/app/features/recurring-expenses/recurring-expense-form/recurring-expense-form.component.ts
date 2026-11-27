import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { LoadingComponent } from 'src/app/core/components/loading/loading.component';
import { ToastService } from 'src/app/core/services/toast.service';
import { BackButtonComponent } from 'src/app/shared/components/back-button/back-button.component';
import { SubmitButtonComponent } from 'src/app/shared/components/submit-button/submit-button.component';
import { CurrencyInputDirective } from 'src/app/shared/directives/currency-input.directive';
import { AccountService } from 'src/app/features/account/services/account.service';
import { AssetService } from 'src/app/features/asset/services/asset.service';
import { CardService } from 'src/app/features/card/services/card.service';
import { TransactionClassService } from 'src/app/features/transactionClass/services/transaction-class.service';
import { RecurringExpensesService } from '../services/recurring-expense.service';
import { RecurringExpenseDetail, RecurringSource } from '../models/recurring-expense.model';
import { monthToApi, monthValue, parseAmount } from '../utils/recurring-expense.utils';

interface Option {
  id: number;
  name: string;
}

// Alta y edición de un fijo o suscripción (plan-gastos-recurrentes.md, Fase 8). En la edición no se cambia dónde se paga (se hace desde la
// ficha), y la moneda y el monto solo mientras no tenga cobros.
@Component({
  selector: 'app-recurring-expense-form',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, LoadingComponent, BackButtonComponent, SubmitButtonComponent, CurrencyInputDirective],
  templateUrl: './recurring-expense-form.component.html'
})
export class RecurringExpenseFormComponent implements OnInit {
  isLoading = true;
  isSubmitting = false;
  // null en el alta.
  id: number | null = null;
  expense: RecurringExpenseDetail | null = null;
  form!: FormGroup;

  categories: Option[] = [];
  cards: Option[] = [];
  accounts: Option[] = [];
  // Las monedas que se pueden elegir según dónde se paga: se asigna al cambiar, no se calcula en la plantilla.
  currencies: Option[] = [];
  private cardCurrencies: Option[] = [];
  private accountCurrencies: Option[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private recurringExpenses: RecurringExpensesService,
    private transactionClassService: TransactionClassService,
    private cardService: CardService,
    private accountService: AccountService,
    private assetService: AssetService,
    private toastService: ToastService
  ) { }

  get isEdit(): boolean {
    return this.id !== null;
  }

  get source(): RecurringSource {
    return this.form.get('source')!.value;
  }

  // La moneda y lo esperado salen de los cobros en cuanto hay alguno.
  get moneyLocked(): boolean {
    return !!this.expense?.hasPayments;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.id = id ? Number(id) : null;

    this.form = this.fb.group({
      name: [''],
      transactionClassId: [null],
      source: ['CARD'],
      cardId: [null],
      accountId: [null],
      assetId: [null],
      frequency: ['MONTHLY'],
      startMonth: [monthValue(new Date())],
      expectedAmount: [''],
      notes: ['']
    });
    this.form.get('source')!.valueChanges.subscribe(() => this.refreshCurrencies());

    const expense: Observable<RecurringExpenseDetail | null> = this.id === null ? of(null) : this.recurringExpenses.getById(this.id);
    forkJoin({
      categories: this.transactionClassService.getAllTransactionClasses() as Observable<any>,
      cards: this.cardService.getAllCards() as Observable<any>,
      accounts: this.accountService.getAccountByTypeName('Moneda') as Observable<any>,
      cardCurrencies: this.assetService.getCardAssets() as Observable<any>,
      accountCurrencies: this.assetService.getAssetsByTypeName('Moneda') as Observable<any>,
      expense
    }).subscribe({
      next: (data) => {
        this.categories = data.categories.filter((c: any) => c.incExp === 'E').map((c: any) => ({ id: c.id, name: c.description }));
        this.cards = data.cards;
        this.accounts = data.accounts;
        this.cardCurrencies = data.cardCurrencies;
        this.accountCurrencies = data.accountCurrencies.map((a: any) => ({ id: a.id, name: a.name }));
        if (data.expense) this.fill(data.expense);
        this.refreshCurrencies();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('No se pudieron cargar los datos');
      }
    });
  }

  private fill(expense: RecurringExpenseDetail): void {
    this.expense = expense;
    this.form.patchValue({
      name: expense.name,
      transactionClassId: expense.transactionClassId,
      source: expense.source,
      cardId: expense.cardId,
      accountId: expense.accountId,
      assetId: expense.assetId,
      frequency: expense.frequency,
      startMonth: monthValue(expense.startMonth),
      expectedAmount: expense.expectedAmount,
      notes: expense.notes ?? ''
    });
    if (expense.hasPayments) {
      this.form.get('assetId')!.disable();
      this.form.get('expectedAmount')!.disable();
    }
  }

  private refreshCurrencies(): void {
    this.currencies = this.source === 'CARD' ? this.cardCurrencies : this.accountCurrencies;

    // Una moneda que no vale para el nuevo origen se vacía.
    const selected = this.form.get('assetId')!.value;
    if (!this.isEdit && selected !== null && !this.currencies.some(c => c.id === selected))
      this.form.get('assetId')!.setValue(null);
  }

  onSubmit(): void {
    if (this.isSubmitting) return;

    // getRawValue: los campos bloqueados también viajan, con lo que ya tenían.
    const value = this.form.getRawValue();
    const problem = this.problemWith(value);
    if (problem) {
      this.toastService.error(problem);
      return;
    }

    const notes = value.notes?.trim() ? value.notes.trim() : null;
    const frequency = value.source === 'CARD' ? 'MONTHLY' : value.frequency;
    this.isSubmitting = true;

    if (this.id === null) {
      this.recurringExpenses.create({
        name: value.name.trim(),
        transactionClassId: value.transactionClassId,
        assetId: value.assetId,
        source: value.source,
        cardId: value.source === 'CARD' ? value.cardId : null,
        accountId: value.source === 'ACCOUNT' ? value.accountId : null,
        frequency,
        startMonth: monthToApi(value.startMonth),
        expectedAmount: parseAmount(value.expectedAmount),
        notes
      }).subscribe({
        next: (created) => this.done('Se agregó', created.id),
        error: (error) => this.failed(error)
      });
    } else {
      const id = this.id;
      this.recurringExpenses.edit(id, {
        name: value.name.trim(),
        transactionClassId: value.transactionClassId,
        assetId: value.assetId,
        frequency,
        expectedAmount: this.moneyLocked ? null : parseAmount(value.expectedAmount),
        notes
      }).subscribe({
        next: () => this.done('Los cambios quedaron guardados', id),
        error: (error) => this.failed(error)
      });
    }
  }

  private problemWith(value: any): string | null {
    if (!value.name?.trim()) return 'Escribí un nombre.';
    if (!value.transactionClassId) return 'Elegí la categoría.';
    if (!this.isEdit && value.source === 'CARD' && !value.cardId) return 'Elegí la tarjeta.';
    if (!this.isEdit && value.source === 'ACCOUNT' && !value.accountId) return 'Elegí la cuenta.';
    if (!value.assetId) return 'Elegí la moneda.';
    if (!this.isEdit && !value.startMonth) return 'Indicá desde qué mes.';
    if (!this.moneyLocked && !(parseAmount(value.expectedAmount) > 0)) return 'El monto esperado tiene que ser mayor que cero.';
    return null;
  }

  private done(message: string, id: number): void {
    this.isSubmitting = false;
    this.toastService.success(message);
    this.router.navigate(['/recurring-expenses', id]);
  }

  private failed(error: any): void {
    this.isSubmitting = false;
    this.toastService.error(error?.error?.message ?? 'No se pudo guardar');
  }
}
