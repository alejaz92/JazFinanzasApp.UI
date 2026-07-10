import { Component, OnInit } from '@angular/core';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioStatsDTO } from '../models/portfolio-stats.model';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-portfolio-list',
    templateUrl: './portfolio-list.component.html',
    styleUrls: ['./portfolio-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, CurrencyFiatFormatPipe]
})
export class PortfolioListComponent implements OnInit {
  isLoading: boolean = true;
  portfolios: PortfolioStatsDTO[] | null = null;
  mainReference: Asset | null = null;

  constructor(private PortfolioService: PortfolioService, private assetService: AssetService) { }

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
    if(portfolioId){
      const confirmed = window.confirm('¿Estás seguro de eliminar esta cartera?');
      if(confirmed) {
        this.PortfolioService.deletePortfolio(portfolioId)
        .subscribe({
          next: (response) => {
            alert('Cartera eliminada correctamente');
            this.ngOnInit();
          }, 
          error: (error) => {
            if (error.error == 'Portfolio is used in transactions') {
              alert('No se puede eliminar la cartera porque está siendo utilizado en transacciones');
            }
            
          }
        });
      }
    }    
  }

}
