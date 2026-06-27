import { Component, OnInit } from '@angular/core';
import { StockTransaction } from '../models/stockTransaction.model';
import { StockTranctionsService } from '../services/stock-tranctions.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { CommerceTypePipe } from '../../../shared/pipes/commerceType/commerce-type.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';
import { MovementTypePipe } from '../../../shared/pipes/movementType/movement-type.pipe';

@Component({
    selector: 'app-stock-transaction-list',
    templateUrl: './stock-transaction-list.component.html',
    styleUrls: ['./stock-transaction-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, NgxPaginationModule, DatePipe, CommerceTypePipe, CurrencyInvestmentFormatPipe, MovementTypePipe]
})
export class StockTransactionListComponent implements OnInit{
  isLoading: boolean = true;
  stockTransactions: StockTransaction[] = [];
  page: number = 1;
  totalStockTransactions: number = 0;
  
  constructor(private stockTransactionService: StockTranctionsService) { }

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
    if (!confirm(`¿Estás seguro de eliminar el movimiento?`)) {
      return
    }
    this.stockTransactionService.deleteTransaction(stockTransaction.id)
      .subscribe(() => {
        this.loadStockTransactions();
      });
  }
}
