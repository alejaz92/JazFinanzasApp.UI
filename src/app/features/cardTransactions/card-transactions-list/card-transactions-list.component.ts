import { Component, OnInit } from '@angular/core';
import { CardTransactionPending } from '../models/cardTransactions-pending.model';
import { CardTransactionsService } from '../services/card-transactions.service';

@Component({
  selector: 'app-card-transactions-list',
  templateUrl: './card-transactions-list.component.html',
  styleUrls: ['./card-transactions-list.component.css']
})
export class CardTransactionsListComponent implements OnInit {
  cardTransactions: CardTransactionPending[] = [];


  constructor(private cardTransactioneService: CardTransactionsService) { }

  ngOnInit(): void {

    this.loadCardTransactions();
  }

  loadCardTransactions() {
    
    this.cardTransactioneService.getPendingCardTransactions()
      .subscribe(response => {
        this.cardTransactions = response;
      });
  }

}
