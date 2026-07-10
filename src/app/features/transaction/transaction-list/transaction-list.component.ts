import { Component, OnInit, ViewChild } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { TransactionService } from '../services/transaction.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { MovementTypePipe } from '../../../shared/pipes/movementType/movement-type.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-transaction-list',
    templateUrl: './transaction-list.component.html',
    styleUrls: ['./transaction-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, NgClass, NgxPaginationModule, DatePipe, CurrencyFiatFormatPipe, MovementTypePipe, ConfirmModalComponent]
})
export class TransactionListComponent implements OnInit {
  isLoading: boolean = true;
  transactions: Transaction[] = [];
  page: number = 1;
  totalTransactions: number = 0;

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private transactionToDelete: Transaction | null = null;

  constructor(private transactionService: TransactionService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions() {
    this.transactionService.getTransactions(this.page,20)
      .subscribe(response => {
        
        this.transactions = response.transactions; 
        this.totalTransactions = response.totalCount;

        this.isLoading = false;
      });
  }

  onPageChange(page: number) {
    this.page = page; 
    this.loadTransactions();


    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeleteTransaction(transaction: Transaction) {
    this.transactionToDelete = transaction;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.transactionToDelete) return;

    this.transactionService.deleteTransaction(this.transactionToDelete.id)
      .subscribe({
        next: () => {
          this.toastService.success('Movimiento eliminado correctamente');
          this.loadTransactions();
        },
        error: () => {
          this.toastService.error('Error al eliminar el movimiento');
        }
      });

    this.transactionToDelete = null;
  }
}

