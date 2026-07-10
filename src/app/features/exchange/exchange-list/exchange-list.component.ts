import { Component, OnInit, ViewChild } from '@angular/core';
import { ExchangeService } from '../services/exchange.service';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-exchange-list',
    templateUrl: './exchange-list.component.html',
    styleUrls: ['./exchange-list.component.css'],
    imports: [RouterLink, NgFor, NgIf, NgxPaginationModule, DatePipe, CurrencyFiatFormatPipe, ConfirmModalComponent]
})
export class ExchangeListComponent implements OnInit {

  Exchanges: any[] = [];
  page: number = 1;
  totalExchanges: number = 0;

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private exchangeToDelete: any | null = null;

  constructor(private exchangeService: ExchangeService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.loadExchanges();
  }

  loadExchanges() {
    this.exchangeService.getExchanges(this.page, 20)
      .subscribe(response => {
        this.Exchanges = response.transactions;        

        this.totalExchanges = response.totalCount;
      });
  }

  onPageChange(page: number) {
    this.page = page; 
    this.loadExchanges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeleteExchange(currencyExchange: any) {
    this.exchangeToDelete = currencyExchange;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.exchangeToDelete) return;

    this.exchangeService.deleteExchange(this.exchangeToDelete.id)
      .subscribe({
        next: () => {
          this.toastService.success('Intercambio eliminado correctamente');
          this.loadExchanges();
        },
        error: () => {
          this.toastService.error('Error al eliminar el intercambio');
        }
      });

    this.exchangeToDelete = null;
  }
}
