import { Component, OnInit } from '@angular/core';
import { PortfolioExchangeService } from '../services/portfolio-exchange.service';

@Component({
  selector: 'app-portfolio-exchange-list',
  templateUrl: './portfolio-exchange-list.component.html',
  styleUrls: ['./portfolio-exchange-list.component.css']
})
export class PortfolioExchangeListComponent implements OnInit {
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
      });
  }

  onPageChange(page: number) {
    this.page = page;
    this.loadPortfolioExchanges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
}
