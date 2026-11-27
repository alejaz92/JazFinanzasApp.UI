import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoadingComponent } from 'src/app/core/components/loading/loading.component';
import { ToastService } from 'src/app/core/services/toast.service';
import { CurrencyFiatFormatPipe } from 'src/app/shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { RecurringExpensesService } from '../services/recurring-expense.service';
import { RecurringExpenseListItem } from '../models/recurring-expense.model';
import { currencySymbol, monthLabel, STATE_BADGES, STATE_LABELS } from '../utils/recurring-expense.utils';

// La sección de fijos y suscripciones: las fichas vigentes arriba y las dadas de baja abajo (plan-gastos-recurrentes.md, Flujo 1).
@Component({
  selector: 'app-recurring-expense-list',
  standalone: true,
  imports: [NgIf, NgFor, NgTemplateOutlet, RouterLink, LoadingComponent, CurrencyFiatFormatPipe],
  templateUrl: './recurring-expense-list.component.html'
})
export class RecurringExpenseListComponent implements OnInit {
  isLoading = true;
  loadFailed = false;
  active: RecurringExpenseListItem[] = [];
  cancelled: RecurringExpenseListItem[] = [];

  readonly monthLabel = monthLabel;
  readonly symbolOf = currencySymbol;

  constructor(
    private recurringExpenses: RecurringExpensesService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.recurringExpenses.getAll().subscribe({
      next: (items) => {
        this.active = items.filter(i => i.isActive);
        this.cancelled = items.filter(i => !i.isActive);
        this.loadFailed = false;
        this.isLoading = false;
      },
      error: () => {
        this.loadFailed = true;
        this.isLoading = false;
        this.toastService.error('No se pudieron cargar los fijos y suscripciones');
      }
    });
  }

  get isEmpty(): boolean {
    return this.active.length === 0 && this.cancelled.length === 0;
  }

  paidWith(item: RecurringExpenseListItem): string {
    return (item.source === 'CARD' ? item.cardName : item.accountName) ?? '';
  }

  stateLabel(item: RecurringExpenseListItem): string {
    return item.currentMonthState ? STATE_LABELS[item.currentMonthState] : 'No se espera';
  }

  stateBadge(item: RecurringExpenseListItem): string {
    return item.currentMonthState ? STATE_BADGES[item.currentMonthState] : 'text-bg-light border';
  }
}
