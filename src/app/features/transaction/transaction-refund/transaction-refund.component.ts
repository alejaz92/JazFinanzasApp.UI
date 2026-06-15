import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TransactionRefund } from '../models/transaction-refund.model';
import { Transaction } from '../models/transaction.model';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from '../services/transaction.service';
import { AccountService } from '../../account/services/account.service';
import { SharedExpenseService } from '../../shared-expenses/services/shared-expense.service';
import { SharedExpenseDetail, SharedExpenseSplit } from '../../shared-expenses/models/shared-expense.model';

interface AllocationRow {
  splitId: number;
  personName: string;
  pendingAmount: number;
  assigned: number;
}

@Component({
  selector: 'app-transaction-refund',
  templateUrl: './transaction-refund.component.html',
  styleUrls: ['./transaction-refund.component.css']
})
export class TransactionRefundComponent implements OnInit, OnDestroy {
  refundForm!: FormGroup;
  id: string | null = null;
  paramsSubscription?: Subscription;
  refundSubscription?: Subscription;
  refund?: TransactionRefund;
  transaction?: Transaction;
  successMessage: string = '';
  accounts: any[] = [];
  isLoading: boolean = true;

  sharedExpense: SharedExpenseDetail | null = null;
  allocations: AllocationRow[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private accountService: AccountService,
    private sharedExpenseService: SharedExpenseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.refundForm = this.fb.group({
      accountId: [null, Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [{ value: '', disabled: false }]
    });

    this.loadAccounts();

    this.paramsSubscription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');
        if (this.id) {
          this.transactionService.getTransactionById(Number(this.id)).subscribe({
            next: (response) => {
              this.transaction = response;

              this.refundForm.patchValue({
                accountId: this.transaction.accountId,
                date: this.transaction.date
                  ? new Date(this.transaction.date).toISOString().split('T')[0]
                  : ''
              });

              this.loadSharedExpense();
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

  loadAccounts() {
    this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
      this.accounts = data;
    });
  }

  loadSharedExpense(): void {
    if (!this.id) return;
    this.sharedExpenseService.getByTransactionId(Number(this.id)).subscribe({
      next: (data) => {
        this.sharedExpense = data;
        this.buildAllocations();
      },
      error: (err) => {
        if (err.status === 404) {
          this.sharedExpense = null;
        }
      }
    });
  }

  private buildAllocations(): void {
    const pending = this.pendingSplits;
    this.allocations = pending.map(s => ({
      splitId: s.id,
      personName: s.personName,
      pendingAmount: Math.round((s.amount - s.amountReimbursed) * 100) / 100,
      assigned: 0
    }));
  }

  get pendingSplits(): SharedExpenseSplit[] {
    return this.sharedExpense?.splits.filter(s => s.status < 2) ?? [];
  }

  get allocationSum(): number {
    return Math.round(this.allocations.reduce((sum, a) => sum + (a.assigned || 0), 0) * 100) / 100;
  }

  get hasAnyAllocation(): boolean {
    return this.allocations.some(a => a.assigned > 0);
  }

  get refundAmountValue(): number {
    const raw = this.refundForm.get('amount')?.value;
    return Number(raw) || 0;
  }

  get allocationRemaining(): number {
    return Math.round((this.refundAmountValue - this.allocationSum) * 100) / 100;
  }

  get allocationsValid(): boolean {
    if (!this.hasAnyAllocation) return true;
    const diff = Math.abs(this.allocationSum - this.refundAmountValue);
    return diff < 0.01
      && this.allocations.every(a => a.assigned >= 0 && a.assigned <= a.pendingAmount);
  }

  distributeEqually(): void {
    const total = this.refundAmountValue;
    if (total <= 0 || this.allocations.length === 0) return;

    const perPerson = Math.round((total / this.allocations.length) * 100) / 100;
    let remaining = total;

    this.allocations.forEach((a, i) => {
      if (i === this.allocations.length - 1) {
        a.assigned = Math.round(remaining * 100) / 100;
      } else {
        const capped = Math.min(perPerson, a.pendingAmount);
        a.assigned = Math.round(capped * 100) / 100;
        remaining -= a.assigned;
      }
    });
  }

  onFormSubmit(): void {
    if (this.refundForm.invalid) return;

    const formValues = this.refundForm.value;
    let oldValue = this.transaction?.amount ?? 0;
    oldValue = Math.abs(oldValue);

    if (isNaN(formValues.amount) || formValues.amount <= 0) {
      this.refundForm.controls['amount'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.amount > oldValue) return;

    if (this.hasAnyAllocation && !this.allocationsValid) {
      return;
    }

    const splitAllocations = this.hasAnyAllocation
      ? this.allocations
          .filter(a => a.assigned > 0)
          .map(a => ({ splitId: a.splitId, amount: a.assigned }))
      : undefined;

    this.refund = {
      accountId: formValues.accountId,
      amount: formValues.amount,
      date: formValues.date,
      splitAllocations
    };

    if (this.id && this.refund) {
      this.refundSubscription = this.transactionService
        .refundTransaction(Number(this.id), this.refund)
        .subscribe({
          next: () => {
            this.successMessage = 'Reembolso realizado con éxito';
            setTimeout(() => {
              this.router.navigate(['/transactions']);
            }, 2000);
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.refundSubscription?.unsubscribe();
  }

  selectAll(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }
}
