import { Component, OnInit, ViewChild } from '@angular/core';
import { PortfolioExchangeService } from '../services/portfolio-exchange.service';
import { CurrencyExchange } from '../../CurrencyExchange/models/CurrencyExchange.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

@Component({
    selector: 'app-portfolio-exchange-list',
    templateUrl: './portfolio-exchange-list.component.html',
    styleUrls: ['./portfolio-exchange-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, NgxPaginationModule, DatePipe, ConfirmModalComponent, CurrencyInvestmentFormatPipe]
})
export class PortfolioExchangeListComponent implements OnInit {
  isLoading: boolean = true;
  portfolioExchanges: any[] = [];
  page: number = 1;
  totalPortfolioExchanges: number = 0;

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private exchangeToDelete: CurrencyExchange | null = null;

  constructor(private portfolioExchangeService: PortfolioExchangeService, private toastService: ToastService) { }

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
    this.exchangeToDelete = portfolioExchange;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.exchangeToDelete) return;

    this.portfolioExchangeService.deleteCurrencyExchange(this.exchangeToDelete.id)
      .subscribe({
        next: () => {
          this.toastService.success('Movimiento eliminado correctamente');
          this.loadPortfolioExchanges();
        },
        error: () => {
          this.toastService.error('Error al eliminar el movimiento');
        }
      });

    this.exchangeToDelete = null;
  }

}
