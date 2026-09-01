import { Component, OnInit, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { NetWorthService } from '../services/net-worth.service';
import { AccountBalance } from '../models/net-worth.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

@Component({
    selector: 'app-net-worth-by-account-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, ChartComponent],
    templateUrl: './net-worth-by-account-report.component.html',
    styleUrl: './net-worth-by-account-report.component.css'
})
export class NetWorthByAccountReportComponent implements OnInit {
    private readonly netWorthService = inject(NetWorthService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    // Arranca en false: hasta no tener una moneda seleccionada no hay nada pedido al backend.
    isLoading = false;
    dataRequested = false;
    accounts: AccountBalance[] = [];
    expandedAccountId: number | null = null;

    barOptions: EChartsOption = {};
    evolutionOptionsByAccount: Record<number, EChartsOption> = {};

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
        this.netWorthService.getByAccount(assetId).subscribe(data => {
            this.accounts = data;
            this.isLoading = false;
            setTimeout(() => this.renderBar(), 0);
        });
    }

    toggle(accountId: number): void {
        this.expandedAccountId = this.expandedAccountId === accountId ? null : accountId;
        if (this.expandedAccountId != null && !this.evolutionOptionsByAccount[accountId]) {
            this.renderEvolution(accountId);
        }
    }

    isExpanded(accountId: number): boolean {
        return this.expandedAccountId === accountId;
    }

    get barChartHeight(): number {
        return Math.max(240, this.accounts.length * 40);
    }

    private renderBar(): void {
        if (this.accounts.length === 0) return;
        const names = this.accounts.map(a => a.accountName);
        const values = this.accounts.map(a => a.balance);
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const axisLabel = this.chartTheme.surface.axisLabel;

        this.barOptions = {
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

    private renderEvolution(accountId: number): void {
        const account = this.accounts.find(a => a.accountId === accountId);
        if (!account) return;
        const labels = account.evolution.map(e => new Date(e.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const values = account.evolution.map(e => e.balance);
        this.evolutionOptionsByAccount[accountId] = this.chartTheme.lineOptions(labels, values, {
            formatValue: (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 }),
        });
    }
}
