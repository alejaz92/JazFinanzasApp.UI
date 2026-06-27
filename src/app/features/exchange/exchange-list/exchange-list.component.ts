import { Component, OnInit } from '@angular/core';
import { ExchangeService } from '../services/exchange.service';
import { RouterLink } from '@angular/router';
import { NgFor, DatePipe } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-exchange-list',
    templateUrl: './exchange-list.component.html',
    styleUrls: ['./exchange-list.component.css'],
    imports: [RouterLink, NgFor, NgxPaginationModule, DatePipe, CurrencyFiatFormatPipe]
})
export class ExchangeListComponent implements OnInit {

  Exchanges: any[] = [];
  page: number = 1;
  totalExchanges: number = 0;
  
  constructor(private exchangeService: ExchangeService ) { }

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
    if (!confirm(`¿Estás seguro de eliminar el intercambio?`)) {
      return
    }
    this.exchangeService.deleteExchange(currencyExchange.id)
      .subscribe(() => {
        this.loadExchanges();
      });
  }
}
