import { Component, OnInit, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { NetWorthService } from '../services/net-worth.service';
import { AccountBalance } from '../models/net-worth.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

interface AssetSummary {
    assetId: number;
    assetName: string;
    assetSymbol: string;
    assetTypeName: string;
    total: number;
}

interface AssetAccountRow {
    accountName: string;
    nativeBalance: number;
    balanceInReferenceAsset: number;
}

// La dirección inversa de "Por cuenta": ahí se ve, para cada cuenta, qué activos tiene; acá se
// elige un activo y se ve en qué cuentas está. Son las dos direcciones de la misma matriz
// cuenta×activo que ya devuelve GetAccountBalancesAsync — no hace falta un endpoint nuevo,
// alcanza con pivotar el mismo dato en el frontend. Reemplaza los dos combos encadenados de
// "Saldos" (Tipo de Activo → Activo → saldo por cuenta).
@Component({
    selector: 'app-net-worth-by-asset-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, ChartComponent],
    templateUrl: './net-worth-by-asset-report.component.html',
    styleUrl: './net-worth-by-asset-report.component.css'
})
export class NetWorthByAssetReportComponent implements OnInit {
    private readonly netWorthService = inject(NetWorthService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    // Arranca en false: hasta no tener una moneda seleccionada no hay nada pedido al backend.
    isLoading = false;
    dataRequested = false;
    accounts: AccountBalance[] = [];

    selectedAssetTypeName: string | null = null;
    selectedAssetId: number | null = null;
    distributionOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    ngOnInit(): void {}

    private load(assetId: number): void {
        this.isLoading = true;
        this.dataRequested = true;
        this.selectedAssetTypeName = null;
        this.selectedAssetId = null;
        this.netWorthService.getByAccount(assetId).subscribe(data => {
            this.accounts = data;
            this.isLoading = false;
        });
    }

    // Todos los activos que aparecen en al menos una cuenta, con su total (moneda de referencia)
    // sumado entre cuentas.
    get allAssets(): AssetSummary[] {
        const byAsset = new Map<number, AssetSummary>();
        for (const account of this.accounts) {
            for (const holding of account.holdings) {
                const existing = byAsset.get(holding.assetId);
                if (existing) existing.total += holding.balanceInReferenceAsset;
                else byAsset.set(holding.assetId, {
                    assetId: holding.assetId,
                    assetName: holding.assetName,
                    assetSymbol: holding.assetSymbol,
                    assetTypeName: holding.assetTypeName,
                    total: holding.balanceInReferenceAsset
                });
            }
        }
        return Array.from(byAsset.values()).sort((a, b) => b.total - a.total);
    }

    // Igual que la vieja "Saldos" (Tipo de Activo → Activo): filtrar primero por tipo evita un combo
    // único con decenas de activos mezclados de cualquier tipo.
    get assetTypeNames(): string[] {
        return Array.from(new Set(this.allAssets.map(a => a.assetTypeName))).sort();
    }

    get assetsForSelectedType(): AssetSummary[] {
        if (this.selectedAssetTypeName == null) return [];
        return this.allAssets.filter(a => a.assetTypeName === this.selectedAssetTypeName);
    }

    get selectedAsset(): AssetSummary | undefined {
        return this.allAssets.find(a => a.assetId === this.selectedAssetId);
    }

    onAssetTypeSelected(assetTypeName: string): void {
        this.selectedAssetTypeName = assetTypeName;
        this.selectedAssetId = null;
    }

    get selectedAssetDistribution(): AssetAccountRow[] {
        if (this.selectedAssetId == null) return [];
        const rows: AssetAccountRow[] = [];
        for (const account of this.accounts) {
            const holding = account.holdings.find(h => h.assetId === this.selectedAssetId);
            if (holding) rows.push({
                accountName: account.accountName,
                nativeBalance: holding.nativeBalance,
                balanceInReferenceAsset: holding.balanceInReferenceAsset
            });
        }
        return rows.sort((a, b) => b.balanceInReferenceAsset - a.balanceInReferenceAsset);
    }

    get distributionChartHeight(): number {
        return Math.max(200, this.selectedAssetDistribution.length * 40);
    }

    onAssetSelected(assetId: number): void {
        this.selectedAssetId = assetId;
        setTimeout(() => this.renderDistribution(), 0);
    }

    private renderDistribution(): void {
        const rows = this.selectedAssetDistribution;
        if (rows.length === 0) return;
        const names = rows.map(r => r.accountName);
        const values = rows.map(r => r.balanceInReferenceAsset);
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const axisLabel = this.chartTheme.surface.axisLabel;

        this.distributionOptions = {
            grid: { left: 120, right: 30, top: 20, bottom: 30 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            yAxis: { type: 'category', data: names, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            series: [{
                type: 'bar',
                data: values,
                itemStyle: { color: (p: any) => this.chartTheme.colorAt(p.dataIndex) },
            }],
        };
    }
}
