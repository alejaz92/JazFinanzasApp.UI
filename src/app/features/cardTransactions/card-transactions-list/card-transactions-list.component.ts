import { Component, OnInit } from '@angular/core';
import { CardTransactionPending } from '../models/cardTransactions-pending.model';
import { CardTransactionsService } from '../services/card-transactions.service';
import { CardTransactionDiscountService } from 'src/app/features/card-transaction-discount/services/card-transaction-discount.service';
import { CardTransactionDiscountDetail } from 'src/app/features/card-transaction-discount/models/card-transaction-discount.model';
import { CardService } from 'src/app/features/card/services/card.service';
import { Card } from 'src/app/features/card/models/card.model';
import { CardDueStatus, getCardDueStatus } from 'src/app/features/card/utils/card-due-status.util';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, NgClass, NgSwitch, NgSwitchCase, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

interface CardWithDueStatus extends Card {
  dueStatus: CardDueStatus;
}

@Component({
    selector: 'app-card-transactions-list',
    templateUrl: './card-transactions-list.component.html',
    styleUrls: ['./card-transactions-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, NgClass, NgSwitch, NgSwitchCase, DatePipe, CurrencyFiatFormatPipe]
})
export class CardTransactionsListComponent implements OnInit {
  isLoading: boolean = true;
  cardTransactions: CardTransactionPending[] = [];
  activeDiscountsByCardTransactionId: Map<number, CardTransactionDiscountDetail> = new Map();
  cardsWithDueNotice: CardWithDueStatus[] = [];

  constructor(
    private cardTransactioneService: CardTransactionsService,
    private cardTransactionDiscountService: CardTransactionDiscountService,
    private cardService: CardService
  ) { }

  ngOnInit(): void {

    this.loadCardTransactions();
    this.loadActiveDiscounts();
    this.loadCardsDueStatus();
  }

  loadCardsDueStatus() {
    this.cardService.getAllCards().subscribe((cards) => {
      this.cardsWithDueNotice = cards
        .map(card => ({ ...card, dueStatus: getCardDueStatus(card) }))
        .filter(card => card.dueStatus !== 'ninguno');
    });
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
