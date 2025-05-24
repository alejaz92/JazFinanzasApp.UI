import { Component, OnInit } from '@angular/core';
import { CryptoTransactionService } from '../services/crypto-transaction.service';
import { CryptoTransaction } from '../models/CryptoTransaction.model';

@Component({
  selector: 'app-crypto-transaction-list',
  templateUrl: './crypto-transaction-list.component.html',
  styleUrls: ['./crypto-transaction-list.component.css']
})
export class CryptoTransactionListComponent implements OnInit{
  isLoading: boolean = true;
  cryptoTransactions: CryptoTransaction[] = [];
  page: number = 1;
  totalCryptoTransactions: number = 0;
  
  constructor(private cryptoTransactionService: CryptoTransactionService) { }

  ngOnInit(): void {
    this.loadCryptoTransactions();
  }

  loadCryptoTransactions() {
    this.cryptoTransactionService.getCryptoTransactions(this.page, 20)
      .subscribe(response => {
        console.log(response);
        this.cryptoTransactions = response.transactions; 

        this.totalCryptoTransactions = response.totalCount;

        this.isLoading = false;
      });
  }

  onPageChange(page: number) {
    this.page = page; 
    this.loadCryptoTransactions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeleteTransaction(cryptoTransaction: CryptoTransaction) {
    if (!confirm(`¿Estás seguro de eliminar el movimiento?`)) {
      return
    }
    this.cryptoTransactionService.deleteCryptoTransaction(cryptoTransaction.id)
      .subscribe(() => {
        this.loadCryptoTransactions();
      });
  }
}
