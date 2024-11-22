import { Component, OnInit } from '@angular/core';
import { StockTransaction } from '../models/stockTransaction.model';
import { StockTranctionsService } from '../services/stock-tranctions.service';

@Component({
  selector: 'app-stock-transaction-list',
  templateUrl: './stock-transaction-list.component.html',
  styleUrls: ['./stock-transaction-list.component.css']
})
export class StockTransactionListComponent implements OnInit{
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
        console.log(response);
        this.stockTransactions = response.transactions; 

        this.totalStockTransactions = response.totalCount;
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
