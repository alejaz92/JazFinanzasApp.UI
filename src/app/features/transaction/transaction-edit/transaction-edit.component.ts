import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from '../services/transaction.service';
import { Subscription } from 'rxjs';
import { Transaction } from '../models/transaction.model';
import { FormGroup } from '@angular/forms';
import { AssetService } from '../../asset/services/asset.service';
import { AccountService } from '../../account/services/account.service';
import { TransactionClassService } from '../../transactionClass/services/transaction-class.service';
import { SharedExpenseService } from '../../shared-expenses/services/shared-expense.service';
import { SharedExpenseDetail, SharedExpenseFormData } from '../../shared-expenses/models/shared-expense.model';

@Component({
    selector: 'app-transaction-edit',
    templateUrl: './transaction-edit.component.html',
    styleUrls: ['./transaction-edit.component.css'],
    standalone: false
})
export class TransactionEditComponent implements OnInit, OnDestroy {
  transactionForm!: FormGroup;
  id: string | null = null;
  assets: any[] = [];
  accounts: any[] = [];
  transactionClasses: any[] = [];
  paramsSubcription?: Subscription;
  editTransactionSubscription?: Subscription;
  transaction?: Transaction;
  successMessage: string = '';
  isLoading: boolean = true;

  sharedExpense: SharedExpenseDetail | null = null;
  sharedExpenseLoaded: boolean = false;
  showAddSharedExpenseForm: boolean = false;
  pendingSharedExpenseData: SharedExpenseFormData | null = null;
  sharedExpenseError: string = '';
  sharedExpenseSaving: boolean = false;

  readonly splitStatusLabel: { [key: number]: string } = {
    0: 'Pendiente',
    1: 'Pago parcial',
    2: 'Pagado'
  };

  readonly splitStatusClass: { [key: number]: string } = {
    0: 'badge bg-warning text-dark',
    1: 'badge bg-info text-dark',
    2: 'badge bg-success'
  };

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private assetsService: AssetService,
    private accountService: AccountService,
    private transactionClassService: TransactionClassService,
    private sharedExpenseService: SharedExpenseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadAssets();
    this.loadAccounts();

    this.paramsSubcription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');
        if (this.id) {
          this.transactionService.getTransactionById(Number(this.id)).subscribe({
            next: (response) => {
              this.transaction = response;

              if (this.transaction?.movementType === 'I') {
                this.transaction.movementType = 'Ingreso';
              } else if (this.transaction) {
                this.transaction.movementType = 'Egreso';
              }

              this.loadTransactionClasses();
              this.transaction.amount = Math.abs(this.transaction.amount);

              if (this.transaction.movementType === 'Egreso') {
                this.loadSharedExpense();
              } else {
                this.sharedExpenseLoaded = true;
              }

              this.isLoading = false;
            },
            error: () => {
              this.isLoading = false;
            }
          });
        }
      }
    });
  }

  loadAssets() {
    this.assetsService.getAssetsByTypeName("Moneda").subscribe((data: any) => {
      this.assets = data;
    });
  }

  loadAccounts() {
    this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
      this.accounts = data;
    });
  }

  loadTransactionClasses() {
    this.transactionClassService.getAllTransactionClasses().subscribe((data: any) => {
      if (this.transaction?.movementType === 'Ingreso') {
        this.transactionClasses = data.filter((x: any) => x.incExp === 'I');
      } else {
        this.transactionClasses = data.filter((x: any) => x.incExp === 'E');
      }
    });
  }

  loadSharedExpense(): void {
    if (!this.id) return;
    this.sharedExpenseService.getByTransactionId(Number(this.id)).subscribe({
      next: (data) => {
        this.sharedExpense = data;
        this.sharedExpenseLoaded = true;
      },
      error: (err) => {
        if (err.status === 404) {
          this.sharedExpense = null;
        }
        this.sharedExpenseLoaded = true;
      }
    });
  }

  get transactionAmountForForm(): number {
    return this.transaction?.amount ?? 0;
  }

  onPendingSharedExpenseChange(data: SharedExpenseFormData | null): void {
    this.pendingSharedExpenseData = data;
    this.sharedExpenseError = '';
  }

  saveSharedExpense(): void {
    if (!this.pendingSharedExpenseData || !this.id) return;

    this.sharedExpenseSaving = true;
    this.sharedExpenseError = '';

    this.sharedExpenseService.createSharedExpense({
      transactionId: Number(this.id),
      notes: this.pendingSharedExpenseData.notes,
      splits: this.pendingSharedExpenseData.splits
    }).subscribe({
      next: (data) => {
        this.sharedExpense = data;
        this.showAddSharedExpenseForm = false;
        this.pendingSharedExpenseData = null;
        this.sharedExpenseSaving = false;
      },
      error: (err) => {
        this.sharedExpenseError = err?.error?.message || 'Error al guardar el gasto compartido.';
        this.sharedExpenseSaving = false;
      }
    });
  }

  deleteSharedExpense(): void {
    if (!this.sharedExpense) return;
    if (!confirm('¿Eliminar el gasto compartido? Esta acción no se puede deshacer.')) return;

    this.sharedExpenseService.deleteSharedExpense(this.sharedExpense.id).subscribe({
      next: () => {
        this.sharedExpense = null;
        this.showAddSharedExpenseForm = false;
      },
      error: (err) => {
        alert(err?.error?.message || 'Error al eliminar el gasto compartido.');
      }
    });
  }

  onFormSubmit(): void {
    const formValues = this.transaction;

    if (!formValues) return;

    if (isNaN(formValues.amount) || formValues.amount <= 0) {
      alert('El monto no es valido');
      return;
    }

    if (this.id && this.transaction) {
      this.editTransactionSubscription = this.transactionService.updateTransaction(Number(this.id), this.transaction).subscribe({
        next: () => {
          this.router.navigateByUrl('/transactions');
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.paramsSubcription?.unsubscribe();
    this.editTransactionSubscription?.unsubscribe();
  }

  updateDate(newDate: string) {
    if (this.transaction) {
      this.transaction.date = new Date(newDate);
    }
  }
}
