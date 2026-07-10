import { Component, OnInit, ViewChild } from '@angular/core';
import { CryptoTransactionService } from '../services/crypto-transaction.service';
import { CryptoTransaction } from '../models/CryptoTransaction.model';
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
    selector: 'app-crypto-transaction-list',
    templateUrl: './crypto-transaction-list.component.html',
    styleUrls: ['./crypto-transaction-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, NgxPaginationModule, DatePipe, CommerceTypePipe, CurrencyInvestmentFormatPipe, MovementTypePipe, ConfirmModalComponent]
})
export class CryptoTransactionListComponent implements OnInit{
  isLoading: boolean = true;
  cryptoTransactions: CryptoTransaction[] = [];
  page: number = 1;
  totalCryptoTransactions: number = 0;

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private transactionToDelete: CryptoTransaction | null = null;

  constructor(private cryptoTransactionService: CryptoTransactionService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.loadCryptoTransactions();
  }

  loadCryptoTransactions() {
    this.cryptoTransactionService.getCryptoTransactions(this.page, 20)
      .subscribe(response => {
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
    this.transactionToDelete = cryptoTransaction;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.transactionToDelete) return;

    this.cryptoTransactionService.deleteCryptoTransaction(this.transactionToDelete.id)
      .subscribe({
        next: () => {
          this.toastService.success('Movimiento eliminado correctamente');
          this.loadCryptoTransactions();
        },
        error: () => {
          this.toastService.error('Error al eliminar el movimiento');
        }
      });

    this.transactionToDelete = null;
  }
}
