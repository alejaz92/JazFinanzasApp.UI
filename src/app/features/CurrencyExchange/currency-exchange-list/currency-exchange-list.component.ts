import { Component, OnInit } from '@angular/core';
import { CurrencyExchangeService } from '../services/currency-exchange.service';

@Component({
  selector: 'app-currency-exchange-list',
  templateUrl: './currency-exchange-list.component.html',
  styleUrls: ['./currency-exchange-list.component.css']
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
        //console.log(response);
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
