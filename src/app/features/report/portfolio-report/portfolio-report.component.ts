import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { EChartsOption } from 'echarts';

import { PortfolioService } from '../../portfolios/services/portfolio.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { PortfolioStatsDTO, PortfolioDetailStatsDTO, PortfolioHoldingDTO, PortfolioValueByDateDTO } from '../../portfolios/models/portfolio-stats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

@Component({
    selector: 'app-portfolio-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, ChartComponent],
    templateUrl: './portfolio-report.component.html',
    styleUrl: './portfolio-report.component.css'
})
export class PortfolioReportComponent implements OnInit {
    isLoading = true;
    isLoadingDetail = false;
    viewAux = false;
    selectedPortfolioId = 0;
    portfolios: PortfolioStatsDTO[] = [];
    detail: PortfolioDetailStatsDTO | null = null;
    mainReference: Asset | null = null;

    // false = agrupado por activo (sin desglosar por cuenta); true = una fila por activo + cuenta
    disaggregateByAccount = false;
    displayedHoldings: PortfolioHoldingDTO[] = [];
    compositionOptions: EChartsOption = {};
    evolutionOptions: EChartsOption = {};

    constructor(
        private portfolioService: PortfolioService,
        private assetService: AssetService,
        private chartTheme: ChartThemeService
    ) {}

    ngOnInit(): void {
        this.loadPortfolios();
        this.loadMainReference();
    }

    loadPortfolios(): void {
        this.portfolioService.getPortfolioStats().subscribe(response => {
            this.portfolios = response;
            this.isLoading = false;
        });
    }

    loadMainReference(): void {
        this.assetService.getReferenceAssets().subscribe((data: Asset[]) => {
            this.mainReference = data.find(x => x.isMainReference) ?? null;
        });
    }

    loadPortfolioDetail(): void {
        if (this.selectedPortfolioId == 0) {
            this.viewAux = false;
            return;
        }
        this.detail = null;
        this.viewAux = false;
        this.isLoadingDetail = true;

        // Combinados: si cada uno renderizara su gráfico desde su propio subscribe con un setTimeout
        // independiente, el de evolución podía correr antes de que "viewAux" pasara a true (todavía no
        // hay <canvas> en el DOM) si esa respuesta llegaba primero — quedaba con la tarjeta vacía sin
        // ningún reintento. Con forkJoin ambos gráficos se renderizan recién cuando los dos datos están
        // listos, en el mismo ciclo que "viewAux".
        forkJoin({
            detail: this.portfolioService.getPortfolioDetailStats(this.selectedPortfolioId),
            // si el historial falla (ej. deploy del endpoint todavía no propagado), no debe tirar abajo
            // el resto de la pestaña -- se degrada a "sin evolución" en vez de romper todo.
            history: this.portfolioService.getPortfolioValueHistory(this.selectedPortfolioId).pipe(
                catchError(() => of([] as PortfolioValueByDateDTO[]))
            )
        }).subscribe(({ detail, history }) => {
            this.isLoadingDetail = false;
            this.viewAux = true;
            this.detail = detail;
            this.updateDisplayedHoldings();
            setTimeout(() => {
                this.renderCompositionChart(detail.holdings);
                this.renderEvolutionChart(history);
            }, 0);
        });
    }

    onToggleDisaggregate(): void {
        this.updateDisplayedHoldings();
    }

    // sin desagregar: agrupa por activo (tipo + nombre + símbolo), sumando cantidad/valores entre cuentas.
    // Con desagregar: la fila tal cual la devuelve el backend (una por activo + cuenta).
    private updateDisplayedHoldings(): void {
        if (!this.detail) {
            this.displayedHoldings = [];
            return;
        }
        if (this.disaggregateByAccount) {
            this.displayedHoldings = this.detail.holdings;
            return;
        }

        const byAsset = new Map<string, PortfolioHoldingDTO>();
        for (const h of this.detail.holdings) {
            const key = `${h.assetType}|${h.assetName}|${h.symbol}`;
            const existing = byAsset.get(key);
            if (existing) {
                existing.quantity += h.quantity;
                existing.originalValue += h.originalValue;
                existing.actualValue += h.actualValue;
            } else {
                byAsset.set(key, { ...h, accountName: '' });
            }
        }
        this.displayedHoldings = Array.from(byAsset.values());
    }

    private renderCompositionChart(holdings: PortfolioHoldingDTO[]): void {
        // el frontend agrupa por AssetType (incluye "Moneda" como una categoría más) — el backend
        // devuelve una fila por activo + cuenta, sin agrupar (ver docs/plans/activos/portfolios-estadisticas.md)
        const byAssetType = new Map<string, number>();
        holdings.forEach(h => byAssetType.set(h.assetType, (byAssetType.get(h.assetType) ?? 0) + h.actualValue));

        const assetTypes = Array.from(byAssetType.keys());
        const values = Array.from(byAssetType.values());
        this.compositionOptions = this.chartTheme.pieOptions(assetTypes, values);
    }

    private renderEvolutionChart(history: PortfolioValueByDateDTO[]): void {
        const labels = history.map(h => new Date(h.date).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const values = history.map(h => h.value);
        this.evolutionOptions = this.chartTheme.lineOptions(labels, values, { colorIndex: 6, smooth: true, skipLabels: false });
    }
}
