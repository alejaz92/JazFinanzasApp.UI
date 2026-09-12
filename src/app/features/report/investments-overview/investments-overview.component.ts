import { Component, effect, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { InvestmentReportService } from '../services/investment-report.service';
import { InvestmentOverview, InvestmentHolding } from '../models/investment-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

// D-18 (revisión de Bolsa, 2026-09-12): etiquetas legibles para los cuatro buckets de
// ClassifyNetWorthBucket — el mapa de bloques agrupa por acá en vez de mostrar 42 activos planos.
const BUCKET_LABELS: Record<string, string> = {
    Stocks: 'Acciones y renta variable',
    Bonds: 'Bonos',
    CryptoStable: 'Cripto estable',
    CryptoVolatile: 'Cripto volátil',
};

// Panorama de inversiones (Fase 20, Flujo 5): pantalla de entrada de la categoría Inversiones —
// mapa de bloques de todo lo invertido (bolsa, cripto, bonos, sin efectivo) coloreado por
// ganancia/pérdida + línea del valor total con los aportes marcados como puntos. Mismo criterio
// que el Panorama general (Fase 17): compone un endpoint que ya trae todo listo (GetOverviewAsync,
// Fase 19), sin recalcular nada acá.
@Component({
    selector: 'app-investments-overview',
    standalone: true,
    imports: [LoadingComponent, NgIf, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, ChartComponent],
    templateUrl: './investments-overview.component.html',
    styleUrl: './investments-overview.component.css'
})
export class InvestmentsOverviewComponent {
    private readonly investmentReportService = inject(InvestmentReportService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = true;
    overview: InvestmentOverview | null = null;

    treemapOptions: EChartsOption = {};
    valueLineOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.investmentReportService.getOverview(assetId).subscribe(data => {
            this.overview = data;
            this.isLoading = false;
            setTimeout(() => this.renderCharts(data), 0);
        });
    }

    private renderCharts(data: InvestmentOverview): void {
        this.renderTreemap(data);
        this.renderValueLine(data);
    }

    // D-18: agrupado por bucket (Acciones y renta variable / Bonos / Cripto estable / Cripto
    // volátil) en vez de 42 bloques planos — mismo helper que Bolsa — General (Fase 20b), sin tocar
    // este endpoint.
    private renderTreemap(data: InvestmentOverview): void {
        if (data.holdings.length === 0) { this.treemapOptions = {}; return; }
        const byBucket = new Map<string, InvestmentHolding[]>();
        for (const h of data.holdings) {
            const list = byBucket.get(h.bucket) ?? [];
            list.push(h);
            byBucket.set(h.bucket, list);
        }
        const groups = Array.from(byBucket.entries()).map(([bucket, holdings]) => ({
            name: BUCKET_LABELS[bucket] ?? bucket,
            items: holdings.map(h => ({ name: h.symbol, value: h.actualValue, gainLossPercent: h.gainLossPercent })),
        }));
        this.treemapOptions = this.chartTheme.groupedTreemapOptions(groups, { formatValue: v => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 }) });
    }

    private renderValueLine(data: InvestmentOverview): void {
        if (data.valueSeries.length === 0) { this.valueLineOptions = {}; return; }
        const labels = data.valueSeries.map(p => new Date(p.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const values = data.valueSeries.map(p => p.value);
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        // A diferencia de Carteras — Detalle (ancho completo), acá el gráfico comparte fila con el
        // mapa de bloques — a mitad de ancho, 12 etiquetas de mes se superponen si se muestran todas.
        const options = this.chartTheme.lineOptions(labels, values, { colorIndex: 6, smooth: true, formatValue: fmt });

        const markerData = data.contributionMarkers
            .map((m, i) => ({ i, contributed: m.contributed }))
            .filter(x => x.contributed > 0)
            .map(x => ({ coord: [x.i, values[x.i]], value: x.contributed }));

        (options.series as any[])[0].markPoint = {
            symbol: 'pin', symbolSize: 32,
            itemStyle: { color: this.chartTheme.status.good },
            label: { formatter: (p: any) => fmt(p.data.value), color: '#fff', fontSize: 9 },
            data: markerData,
        };

        this.valueLineOptions = options;
    }
}
