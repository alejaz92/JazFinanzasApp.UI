import { Component, OnInit } from '@angular/core';
import { PortfolioExchangeService } from '../services/portfolio-exchange.service';
import { CurrencyExchange } from '../../CurrencyExchange/models/CurrencyExchange.model';

@Component({
  selector: 'app-portfolio-exchange-list',
  templateUrl: './portfolio-exchange-list.component.html',
  styleUrls: ['./portfolio-exchange-list.component.css']
})
export class PortfolioExchangeListComponent implements OnInit {
  isLoading: boolean = true;
  portfolioExchanges: any[] = [];
  page: number = 1;
  totalPortfolioExchanges: number = 0;
  constructor(private portfolioExchangeService: PortfolioExchangeService) { }

  ngOnInit(): void {
    this.loadPortfolioExchanges();
  }

  loadPortfolioExchanges() {
    this.portfolioExchangeService.getPortfolioExchanges(this.page, 20)
      .subscribe(response => {
        this.portfolioExchanges = response.transactionsDTO;
        this.totalPortfolioExchanges = response.totalCount;

        this.isLoading = false;
      });
  }

  onPageChange(page: number) {
    this.page = page;
    this.loadPortfolioExchanges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeleteExchange(portfolioExchange: CurrencyExchange) {
    if (!confirm(`¿Estás seguro de eliminar el movimiento?`)) {
      return
    }

    this.portfolioExchangeService.deleteCurrencyExchange(portfolioExchange.id)
      .subscribe(() => {
        this.loadPortfolioExchanges();
      })  
  }
  
}
