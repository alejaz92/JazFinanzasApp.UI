import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TransactionService } from '../services/transaction.service';
import { AccountService } from '../../account/services/account.service';
import { AssetService } from '../../asset/services/asset.service';
import { TransactionClassService } from '../../transactionClass/services/transaction-class.service';
import { SharedExpenseService } from '../../shared-expenses/services/shared-expense.service';
import { SharedExpenseFormData } from '../../shared-expenses/models/shared-expense.model';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { CurrencyInputDirective } from '../../../shared/directives/currency-input.directive';
import { SharedExpenseFormComponent } from '../../shared-expenses/shared-expense-form/shared-expense-form.component';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';


@Component({
    selector: 'app-transaction-add',
    templateUrl: './transaction-add.component.html',
    styleUrls: ['./transaction-add.component.css'],
    imports: [LoadingComponent, NgIf, FormsModule, ReactiveFormsModule, NgFor, CurrencyInputDirective, SharedExpenseFormComponent, BackButtonComponent]
})
export class TransactionAddComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  transactionForm!: FormGroup;
  selectedMovementType: string = '';
  accounts: any[] = [];
  incomeClasses: any[] = [];
  expenseClasses: any[] = [];
  assets: any[] = [];

  sharedExpenseActive: boolean = false;
  sharedExpenseData: SharedExpenseFormData | null = null;
  transactionAmountForForm: number = 0;
  sharedExpenseError: string = '';

  private amountSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private accountService: AccountService,
    private assetService: AssetService,
    private transactionClasses: TransactionClassService,
    private sharedExpenseService: SharedExpenseService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      movementType: ['', Validators.required],
      date: ['', Validators.required],
      asset: ['', Validators.required],
      amount: ['', Validators.required],
      detail: [''],
      incomeAccount: [''],
      expenseAccount: [''],
      incomeClass: [''],
      expenseClass: [''],
      incomeExchangeAccount: [''],
      expenseExchangeAccount: [''],
    });

    this.loadAccounts();
    this.loadAssets();
    this.loadTransactionClasses();

    this.amountSub = this.transactionForm.get('amount')?.valueChanges.subscribe(value => {
      this.transactionAmountForForm = this.parseFormAmount(value);
    });
  }

  ngOnDestroy(): void {
    this.amountSub?.unsubscribe();
  }

  loadAccounts() {
    this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
      this.accounts = data;
    });
  }

  loadAssets() {
    this.assetService.getAssetsByTypeName("Moneda").subscribe((data: any) => {
      this.assets = data;
    });
  }

  loadTransactionClasses() {
    this.transactionClasses.getAllTransactionClasses().subscribe((data: any) => {
      this.incomeClasses = data.filter((x: any) => x.incExp === 'I');
      this.expenseClasses = data.filter((x: any) => x.incExp === 'E');
      this.isLoading = false;
    });
  }

  onMovementTypeChange(event: any) {
    this.selectedMovementType = event.target.value;
    if (this.selectedMovementType !== 'E') {
      this.sharedExpenseActive = false;
      this.sharedExpenseData = null;
    }
  }

  onSharedExpenseToggle(): void {
    if (!this.sharedExpenseActive) {
      this.sharedExpenseData = null;
    }
  }

  onSharedExpenseChange(data: SharedExpenseFormData | null): void {
    this.sharedExpenseData = data;
    this.sharedExpenseError = '';
  }

  private parseFormAmount(value: any): number {
    if (!value) return 0;
    const str = String(value);
    let normalized: string;
    if (str.includes('.') && str.includes(',')) {
      normalized = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
      normalized = str.replace(',', '.');
    } else {
      normalized = str;
    }
    const n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
  }

  onSubmit() {
    const formValues = this.transactionForm.value;

    if (formValues.movementType === '') {
      this.transactionForm.controls['movementType'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.date === '') {
      this.transactionForm.controls['date'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.asset === '') {
      this.transactionForm.controls['asset'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.movementType === 'I') {
      if (formValues.incomeAccount === '') {
        this.transactionForm.controls['incomeAccount'].setErrors({ 'incorrect': true });
        return;
      }
      if (formValues.incomeClass === '') {
        this.transactionForm.controls['incomeClass'].setErrors({ 'incorrect': true });
        return;
      }
    }

    if (formValues.movementType === 'E') {
      if (formValues.expenseAccount === '') {
        this.transactionForm.controls['expenseAccount'].setErrors({ 'incorrect': true });
        return;
      }
      if (formValues.expenseClass === '') {
        this.transactionForm.controls['expenseClass'].setErrors({ 'incorrect': true });
        return;
      }
    }

    if (isNaN(formValues.amount) || formValues.amount <= 0) {
      this.transactionForm.controls['amount'].setErrors({ 'incorrect': true });
      return;
    }

    if (this.sharedExpenseActive && formValues.movementType === 'E' && !this.sharedExpenseData) {
      this.sharedExpenseError = 'Debe agregar al menos una persona con monto válido al gasto compartido.';
      return;
    }

    const transactionAdd = {
      incomeAccountId: formValues.movementType === "I" ? parseInt(formValues.incomeAccount) : null,
      expenseAccountId: formValues.movementType === "E" ? parseInt(formValues.expenseAccount) : null,
      assetId: parseInt(formValues.asset),
      date: formValues.date,
      movementType: formValues.movementType,
      transactionClassId: formValues.movementType === 'I'
        ? (formValues.incomeClass ? parseInt(formValues.incomeClass, 10) : null)
        : (formValues.expenseClass ? parseInt(formValues.expenseClass, 10) : null),
      detail: formValues.detail,
      amount: Number(formValues.amount),
      quotePrice: 0
    };

    if (this.transactionForm.invalid) {
      return;
    }

    const createAndLinkSharedExpense = this.sharedExpenseActive
      && formValues.movementType === 'E'
      && this.sharedExpenseData !== null;

    this.transactionService.createTransaction(transactionAdd).pipe(
      switchMap(response => {
        if (createAndLinkSharedExpense && this.sharedExpenseData) {
          return this.sharedExpenseService.createSharedExpense({
            transactionId: response.id,
            notes: this.sharedExpenseData.notes,
            splits: this.sharedExpenseData.splits
          });
        }
        return of(null);
      })
    ).subscribe({
      next: () => {
        this.transactionForm.reset();
        this.selectedMovementType = '';
        this.sharedExpenseActive = false;
        this.sharedExpenseData = null;
        this.sharedExpenseError = '';
        this.transactionAmountForForm = 0;
        this.toastService.success('Movimiento creado con éxito');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al guardar el gasto compartido.';
        this.sharedExpenseError = msg;
        this.toastService.error(msg);
      }
    });
  }
}
