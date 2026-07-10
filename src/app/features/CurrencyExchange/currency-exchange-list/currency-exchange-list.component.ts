import { Component, OnInit, ViewChild } from '@angular/core';
import { CurrencyExchangeService } from '../services/currency-exchange.service';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-currency-exchange-list',
    templateUrl: './currency-exchange-list.component.html',
    styleUrls: ['./currency-exchange-list.component.css'],
    imports: [RouterLink, NgFor, NgIf, NgxPaginationModule, DatePipe, CurrencyFiatFormatPipe, ConfirmModalComponent]
})
export class CurrencyExchangeListComponent implements OnInit{
  currencyExchanges: any[] = [];
  page: number = 1;
  totalCurrencyExchanges: number = 0;

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private exchangeToDelete: any | null = null;

  constructor(private currencyExchangeService: CurrencyExchangeService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.loadCurrencyExchanges();
  }

  loadCurrencyExchanges() {
    this.currencyExchangeService.getCurrencyExchanges(this.page, 20)
      .subscribe(response => {
        this.currencyExchanges = response.transactionsDTO;        

        this.totalCurrencyExchanges = response.totalCount;
      });
  }

  onPageChange(page: number) {
    this.page = page; 
    this.loadCurrencyExchanges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeleteExchange(currencyExchange: any) {
    this.exchangeToDelete = currencyExchange;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.exchangeToDelete) return;

    this.currencyExchangeService.deleteCurrencyExchange(this.exchangeToDelete.id)
      .subscribe({
        next: () => {
          this.toastService.success('Intercambio eliminado correctamente');
          this.loadCurrencyExchanges();
        },
        error: () => {
          this.toastService.error('Error al eliminar el intercambio');
        }
      });

    this.exchangeToDelete = null;
  }
}
