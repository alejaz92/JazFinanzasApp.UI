import { Component, OnInit } from '@angular/core';
import { PersonDebtSummary } from '../models/shared-expense.model';
import { SharedExpenseService } from '../services/shared-expense.service';

@Component({
  selector: 'app-shared-expense-dashboard',
  templateUrl: './shared-expense-dashboard.component.html'
})
export class SharedExpenseDashboardComponent implements OnInit {
  isLoading = true;
  summary: PersonDebtSummary[] = [];
  filterStatus: 'all' | 'pending' | 'paid' = 'pending';

  constructor(private sharedExpenseService: SharedExpenseService) {}

  ngOnInit(): void {
    this.load();
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
}
