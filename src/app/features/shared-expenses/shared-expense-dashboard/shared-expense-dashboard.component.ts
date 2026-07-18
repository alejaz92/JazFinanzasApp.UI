import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PersonDebtSplit, PersonDebtSummary } from '../models/shared-expense.model';
import { SharedExpenseService } from '../services/shared-expense.service';
import { SharedEventService } from '../../shared-events/services/shared-event.service';
import { SharedEventActiveSummary, SharedEventConsolidatedDebt } from '../../shared-events/models/shared-event.model';
import { AccountService } from '../../account/services/account.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgClass, NgFor, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-shared-expense-dashboard',
    templateUrl: './shared-expense-dashboard.component.html',
    imports: [LoadingComponent, NgIf, NgClass, NgFor, DecimalPipe, RouterLink, FormsModule, ReactiveFormsModule, CurrencyFiatFormatPipe]
})
export class SharedExpenseDashboardComponent implements OnInit {
  isLoading = true;
  summary: PersonDebtSummary[] = [];
  filterStatus: 'all' | 'pending' | 'paid' = 'pending';
  expandedPersonId: number | null = null;

  accounts: any[] = [];

  consolidatedDebts: SharedEventConsolidatedDebt[] = [];
  activeEvents: SharedEventActiveSummary[] = [];

  reimbursementForm!: FormGroup;
  selectedSplit: PersonDebtSplit | null = null;
  reimbursementError: string = '';

  constructor(
    private fb: FormBuilder,
    private sharedExpenseService: SharedExpenseService,
    private sharedEventService: SharedEventService,
    private accountService: AccountService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.reimbursementForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: ['', Validators.required],
      accountId: ['', Validators.required]
    });

    this.load();
    this.loadAccounts();
    this.loadConsolidated();
  }

  loadConsolidated(): void {
    this.sharedEventService.getConsolidatedDebts().subscribe({
      next: data => this.consolidatedDebts = data,
      error: () => this.toastService.error('Error al cargar el resumen consolidado de eventos')
    });
    this.sharedEventService.getActiveSummary().subscribe({
      next: data => this.activeEvents = data,
      error: () => this.toastService.error('Error al cargar los eventos compartidos activos')
    });
  }

  load(): void {
    this.isLoading = true;
    this.sharedExpenseService.getSummary().subscribe({
      next: (data) => {
        this.summary = data;
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Error al cargar los gastos compartidos');
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
        this.toastService.success('Reintegro registrado con éxito');
        this.load();
      },
      error: (err) => {
        this.reimbursementError = err?.error?.message || 'Error al registrar el reintegro.';
      }
    });
  }
}
