import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardTransactionPending } from '../models/cardTransactions-pending.model';
import { CardTransactionsService } from '../services/card-transactions.service';
import { CardTransactionDiscountService } from 'src/app/features/card-transaction-discount/services/card-transaction-discount.service';
import { CardTransactionDiscountDetail } from 'src/app/features/card-transaction-discount/models/card-transaction-discount.model';
import { AccountService } from 'src/app/features/account/services/account.service';
import { CardService } from 'src/app/features/card/services/card.service';
import { Card } from 'src/app/features/card/models/card.model';
import { CardDueStatus, getCardDueStatus } from 'src/app/features/card/utils/card-due-status.util';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, NgClass, NgSwitch, NgSwitchCase, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ToastService } from '../../../core/services/toast.service';

interface CardWithDueStatus extends Card {
  dueStatus: CardDueStatus;
}

@Component({
    selector: 'app-card-transactions-list',
    templateUrl: './card-transactions-list.component.html',
    styleUrls: ['./card-transactions-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, NgClass, NgSwitch, NgSwitchCase, DatePipe, CurrencyFiatFormatPipe, ReactiveFormsModule]
})
export class CardTransactionsListComponent implements OnInit {
  isLoading: boolean = true;
  cardTransactions: CardTransactionPending[] = [];
  activeDiscountsByCardTransactionId: Map<number, CardTransactionDiscountDetail> = new Map();
  cardsWithDueNotice: CardWithDueStatus[] = [];

  accounts: any[] = [];
  rescueForm!: FormGroup;
  selectedDiscount: CardTransactionDiscountDetail | null = null;
  selectedDiscountDetail: string = '';
  rescueError: string = '';

  constructor(
    private cardTransactioneService: CardTransactionsService,
    private cardTransactionDiscountService: CardTransactionDiscountService,
    private accountService: AccountService,
    private cardService: CardService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.rescueForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      accountId: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });

    this.loadCardTransactions();
    this.loadActiveDiscounts();
    this.loadCardsDueStatus();
    this.loadAccounts();
  }

  loadAccounts() {
    this.accountService.getAccountByTypeName('Moneda').subscribe((data: any) => {
      this.accounts = data;
    });
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

  // Lo que sigue como saldo a favor en la tarjeta: todavía no entró a ninguna cuenta.
  pendingOnCard(discount: CardTransactionDiscountDetail): number {
    return discount.pendingOnCard;
  }

  // Lo que ya está en una cuenta como ingreso, esperando consumirse en las próximas cuotas.
  pendingInAccount(discount: CardTransactionDiscountDetail): number {
    return discount.amountMaterialized - discount.amountApplied;
  }

  openRescueModal(discount: CardTransactionDiscountDetail, detail: string): void {
    this.selectedDiscount = discount;
    this.selectedDiscountDetail = detail;
    this.rescueError = '';
    this.rescueForm.reset({
      amount: discount.pendingOnCard,
      accountId: '',
      date: new Date().toISOString().split('T')[0]
    });
  }

  closeRescueModal(): void {
    this.selectedDiscount = null;
    this.selectedDiscountDetail = '';
    this.rescueError = '';
  }

  confirmRescue(): void {
    if (!this.selectedDiscount || this.rescueForm.invalid) return;

    const amount = Number(this.rescueForm.get('amount')?.value);
    if (amount > this.selectedDiscount.pendingOnCard) {
      this.rescueError = 'El monto supera el saldo a favor pendiente en la tarjeta.';
      return;
    }

    this.cardTransactionDiscountService.rescue(this.selectedDiscount.id, {
      amount,
      accountId: Number(this.rescueForm.get('accountId')?.value),
      date: this.rescueForm.get('date')?.value
    }).subscribe({
      next: () => {
        this.closeRescueModal();
        this.loadActiveDiscounts();
        this.toastService.success('Saldo a favor pasado a la cuenta');
      },
      error: (err) => {
        this.rescueError = err?.error?.message || 'Error al registrar el rescate.';
      }
    });
  }
}
