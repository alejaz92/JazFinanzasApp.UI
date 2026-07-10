import { Component, OnInit, ViewChild } from '@angular/core';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioStatsDTO } from '../models/portfolio-stats.model';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-portfolio-list',
    templateUrl: './portfolio-list.component.html',
    styleUrls: ['./portfolio-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, CurrencyFiatFormatPipe, ConfirmModalComponent]
})
export class PortfolioListComponent implements OnInit {
  isLoading: boolean = true;
  portfolios: PortfolioStatsDTO[] | null = null;
  mainReference: Asset | null = null;

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private portfolioIdToDelete: number | null = null;

  constructor(
    private PortfolioService: PortfolioService,
    private assetService: AssetService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.PortfolioService.getPortfolioStats().subscribe((response) => {
      this.portfolios = response;
      this.isLoading = false;
    });

    // moneda de referencia del usuario, para aclarar en qué está expresado "Valor actual"
    // (mismo patrón que reports.component.ts/home.component.ts)
    this.assetService.getReferenceAssets().subscribe((data: Asset[]) => {
      this.mainReference = data.find((x) => x.isMainReference) ?? null;
    });
  }

  onDelete(portfolioId: number): void {
    if (!portfolioId) return;
    this.portfolioIdToDelete = portfolioId;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.portfolioIdToDelete) return;

    this.PortfolioService.deletePortfolio(this.portfolioIdToDelete)
      .subscribe({
        next: (response) => {
          this.toastService.success('Cartera eliminada correctamente');
          this.ngOnInit();
        },
        error: (error) => {
          if (error.error == 'Portfolio is used in transactions') {
            this.toastService.error('No se puede eliminar la cartera porque está siendo utilizado en transacciones');
          }
        }
      });

    this.portfolioIdToDelete = null;
  }

}
