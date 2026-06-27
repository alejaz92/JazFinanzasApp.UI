import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PersonDebtSplit, PersonDebtSummary } from '../models/shared-expense.model';
import { SharedExpenseService } from '../services/shared-expense.service';
import { AccountService } from '../../account/services/account.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-shared-expense-dashboard',
    templateUrl: './shared-expense-dashboard.component.html',
    imports: [LoadingComponent, NgIf, NgClass, NgFor, FormsModule, ReactiveFormsModule, CurrencyFiatFormatPipe]
})
export class SharedExpenseDashboardComponent implements OnInit {
  isLoading = true;
  summary: PersonDebtSummary[] = [];
  filterStatus: 'all' | 'pending' | 'paid' = 'pending';
  expandedPersonId: number | null = null;

  accounts: any[] = [];

  reimbursementForm!: FormGroup;
  selectedSplit: PersonDebtSplit | null = null;
  reimbursementError: string = '';
  reimbursementSuccess: string = '';

  constructor(
    private fb: FormBuilder,
    private sharedExpenseService: SharedExpenseService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.reimbursementForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: ['', Validators.required],
      accountId: ['', Validators.required]
    });

    this.load();
    this.loadAccounts();
  }

  load(): void {
    this.isLoading = true;
    this.sharedExpenseService.getSummary().subscribe({
      next: (data) => {
        this.summary = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadAccounts(): void {
    this.accountService.getAccountByTypeName('Moneda').subscribe((data: any) => {
      this.accounts = data;
    });
  }

  get filtered(): PersonDebtSummary[] {
    if (this.filterStatus === 'pending') {
      return this.summary.filter(s => s.totalPending > 0);
    } else if (this.filterStatus === 'paid') {
      return this.summary.filter(s => s.totalPending === 0);
    }
    return this.summary;
  }

  get totalPending(): number {
    return this.summary.reduce((sum, s) => sum + s.totalPending, 0);
  }

  toggleExpand(personId: number): void {
    this.expandedPersonId = this.expandedPersonId === personId ? null : personId;
  }

  isCardSplit(split: PersonDebtSplit): boolean {
    return !!split.cardTransactionId;
  }

  openReimbursementModal(split: PersonDebtSplit): void {
    this.selectedSplit = split;
    this.reimbursementError = '';
    this.reimbursementForm.reset({
      amount: split.pending,
      date: new Date().toISOString().split('T')[0],
      accountId: ''
    });
  }

  closeReimbursementModal(): void {
    this.selectedSplit = null;
  }

  confirmReimbursement(): void {
    if (!this.selectedSplit || this.reimbursementForm.invalid) {
      return;
    }

    const formValues = this.reimbursementForm.value;

    if (Number(formValues.amount) > this.selectedSplit.pending) {
      this.reimbursementError = 'El monto no puede superar la deuda pendiente.';
      return;
    }

    this.sharedExpenseService.registerReimbursement({
      splitId: this.selectedSplit.splitId,
      amount: Number(formValues.amount),
      date: formValues.date,
      accountId: parseInt(formValues.accountId, 10)
    }).subscribe({
      next: () => {
        this.closeReimbursementModal();
        this.reimbursementSuccess = 'Reintegro registrado con éxito';
        this.load();
        setTimeout(() => { this.reimbursementSuccess = ''; }, 3000);
      },
      error: (err) => {
        this.reimbursementError = err?.error?.message || 'Error al registrar el reintegro.';
      }
    });
  }
}
