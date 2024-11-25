import { Component, OnInit } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { TransactionService } from '../services/transaction.service';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
  transactions: Transaction[] = []; 
  page: number = 1;
  totalTransactions: number = 0;

  constructor(private transactionService: TransactionService) { }

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions() {
    this.transactionService.getTransactions(this.page,20)
      .subscribe(response => {
        
        this.transactions = response.transactions; 
        this.totalTransactions = response.totalCount;
      });
  }

  onPageChange(page: number) {
    this.page = page; 
    this.loadTransactions();


    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeleteTransaction(transaction: Transaction) {

    //preguntar si esta seguro de eliminar
    if (!confirm(`¿Estás seguro de eliminar el movimiento?`)) {
      return
    }

    this.transactionService.deleteTransaction(transaction.id)
      .subscribe(() => {
        
        this.loadTransactions();
      });
  }
}

