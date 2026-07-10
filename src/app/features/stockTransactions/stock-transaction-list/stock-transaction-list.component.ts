import { Component, OnInit, ViewChild } from '@angular/core';
import { StockTransaction } from '../models/stockTransaction.model';
import { StockTranctionsService } from '../services/stock-tranctions.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { CommerceTypePipe } from '../../../shared/pipes/commerceType/commerce-type.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';
import { MovementTypePipe } from '../../../shared/pipes/movementType/movement-type.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-stock-transaction-list',
    templateUrl: './stock-transaction-list.component.html',
    styleUrls: ['./stock-transaction-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, NgxPaginationModule, DatePipe, CommerceTypePipe, CurrencyInvestmentFormatPipe, MovementTypePipe, ConfirmModalComponent]
})
export class StockTransactionListComponent implements OnInit{
  isLoading: boolean = true;
  stockTransactions: StockTransaction[] = [];
  page: number = 1;
  totalStockTransactions: number = 0;

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private transactionToDelete: StockTransaction | null = null;

  constructor(private stockTransactionService: StockTranctionsService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.loadStockTransactions();
  }

  loadStockTransactions() {
    this.stockTransactionService.getStockTransactions(this.page, 20)
      .subscribe(response => {
        
        this.stockTransactions = response.transactionsDTO; 


        this.totalStockTransactions = response.totalCount;

        this.isLoading = false;
      });
  }

  onPageChange(page: number) {
    this.page = page; 
    this.loadStockTransactions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeleteTransaction(stockTransaction: StockTransaction) {
    this.transactionToDelete = stockTransaction;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.transactionToDelete) return;

    this.stockTransactionService.deleteTransaction(this.transactionToDelete.id)
      .subscribe({
        next: () => {
          this.toastService.success('Movimiento eliminado correctamente');
          this.loadStockTransactions();
        },
        error: () => {
          this.toastService.error('Error al eliminar el movimiento');
        }
      });

    this.transactionToDelete = null;
  }
}
