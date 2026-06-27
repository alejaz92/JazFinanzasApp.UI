import { Component, OnInit } from '@angular/core';
import { CurrencyExchangeService } from '../services/currency-exchange.service';
import { RouterLink } from '@angular/router';
import { NgFor, DatePipe } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-currency-exchange-list',
    templateUrl: './currency-exchange-list.component.html',
    styleUrls: ['./currency-exchange-list.component.css'],
    imports: [RouterLink, NgFor, NgxPaginationModule, DatePipe, CurrencyFiatFormatPipe]
})
export class CurrencyExchangeListComponent implements OnInit{
  currencyExchanges: any[] = [];
  page: number = 1;
  totalCurrencyExchanges: number = 0;
  
  constructor(private currencyExchangeService: CurrencyExchangeService) { }

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
    if (!confirm(`¿Estás seguro de eliminar el intercambio?`)) {
      return
    }
    this.currencyExchangeService.deleteCurrencyExchange(currencyExchange.id)
      .subscribe(() => {
        this.loadCurrencyExchanges();
      });
  }
}
