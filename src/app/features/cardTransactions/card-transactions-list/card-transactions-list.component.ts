import { Component, OnInit } from '@angular/core';
import { CardTransactionPending } from '../models/cardTransactions-pending.model';
import { CardTransactionsService } from '../services/card-transactions.service';
import { CardTransactionDiscountService } from 'src/app/features/card-transaction-discount/services/card-transaction-discount.service';
import { CardTransactionDiscountDetail } from 'src/app/features/card-transaction-discount/models/card-transaction-discount.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-card-transactions-list',
    templateUrl: './card-transactions-list.component.html',
    styleUrls: ['./card-transactions-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, DatePipe, CurrencyFiatFormatPipe]
})
export class CardTransactionsListComponent implements OnInit {
  isLoading: boolean = true;
  cardTransactions: CardTransactionPending[] = [];
  activeDiscountsByCardTransactionId: Map<number, CardTransactionDiscountDetail> = new Map();

  constructor(
    private cardTransactioneService: CardTransactionsService,
    private cardTransactionDiscountService: CardTransactionDiscountService
  ) { }

  ngOnInit(): void {

    this.loadCardTransactions();
    this.loadActiveDiscounts();
  }

  loadCardTransactions() {

    this.cardTransactioneService.getPendingCardTransactions()
      .subscribe(response => {
        this.cardTransactions = response;

        this.isLoading = false;
      });
  }

  loadActiveDiscounts() {
    this.cardTransactionDiscountService.getActive().subscribe((discounts) => {
      this.activeDiscountsByCardTransactionId = new Map(discounts.map(d => [d.cardTransactionId, d]));
    });
  }

  getDiscount(cardTransactionId: number): CardTransactionDiscountDetail | undefined {
    return this.activeDiscountsByCardTransactionId.get(cardTransactionId);
  }

}
