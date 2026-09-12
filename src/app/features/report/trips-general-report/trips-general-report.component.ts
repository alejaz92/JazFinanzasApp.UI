import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { EChartsOption } from 'echarts';

import { TripReportService } from '../services/trip-report.service';
import { TripGeneralReport } from '../models/trip-report.model';
import { TripStatus, TripType } from '../../trips/models/trip.model';
import { AssetService } from '../../asset/services/asset.service';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

const STATUS_LABELS: Record<TripStatus, string> = {
    PLANNED: 'Planificado',
    IN_PROGRESS: 'En curso',
    FINISHED: 'Finalizado'
};

const TYPE_LABELS: Record<TripType, string> = {
    DOMESTIC: 'Doméstico',
    INTERNATIONAL: 'Internacional'
};

// Viajes — General (Fase 22, Flujo 6): reescrita sobre TripReportController (Fase 21) en vez de
// TripService.getTripsGeneralStats — mismo dato de fondo, pero con el assetId de la barra de
// Reportes (T12) en vez de la moneda principal resuelta del usuario, y con Duración/CostoPorDía ya
// calculados por el backend. Suma el gráfico de burbujas que pedía el Flujo 6 (duración vs costo
// total, tamaño = costo por día) — con dos viajes ya se lee, mejora con cada uno.
@Component({
    selector: 'app-trips-general-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DatePipe, RouterLink, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './trips-general-report.component.html',
    styleUrl: './trips-general-report.component.css'
})
export class TripsGeneralReportComponent {
    private readonly tripReportService = inject(TripReportService);
    private readonly assetService = inject(AssetService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = true;
    trips: TripGeneralReport[] = [];
    referenceAssetSymbol = '';

    totalByTripOptions: EChartsOption = {};
    bubbleOptions: EChartsOption = {};

    // El backend no devuelve el símbolo de la moneda (la respuesta es una lista de viajes, sin un
    // lugar natural para un dato a nivel reporte) — se resuelve acá, mismo mecanismo que la
    // pantalla vieja usaba para "mainReference", ahora contra el assetId elegido en la barra.
    private referenceAssetSymbols = new Map<number, string>();

    constructor() {
        this.assetService.getReferenceAssets().subscribe(assets => {
            this.referenceAssetSymbols = assets.reduce((map, a) => map.set(a.id, a.symbol), new Map<number, string>());
            const current = this.reportContext.currencyAssetId();
            if (current != null) this.referenceAssetSymbol = this.referenceAssetSymbols.get(current) ?? '';
        });

        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.referenceAssetSymbol = this.referenceAssetSymbols.get(assetId) ?? '';
        this.tripReportService.getGeneral(assetId).subscribe(trips => {
            this.trips = [...trips].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            this.isLoading = false;
            setTimeout(() => this.renderCharts(), 0);
        });
    }

    get totalSpent(): number {
        return this.trips.reduce((sum, t) => sum + t.total, 0);
    }

    statusLabel(status: TripStatus): string {
        return STATUS_LABELS[status];
    }

    typeLabel(type: TripType): string {
        return TYPE_LABELS[type];
    }

    private renderCharts(): void {
        if (this.trips.length === 0) return;
        this.renderTotalByTrip();
        this.renderBubble();
    }

    private renderTotalByTrip(): void {
        const names = this.trips.map(t => t.name);
        const values = this.trips.map(t => t.total);
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const axisLabel = this.chartTheme.surface.axisLabel;
        // Ancho fijo (100px, heredado de la pantalla vieja) recortaba nombres largos ("Mar Chiquita
        // 2026" quedaba "ar Chiquita 2026") — se estima según el nombre más largo en vez de un valor fijo.
        const leftMargin = Math.min(200, Math.max(100, Math.max(...names.map(n => n.length)) * 7));

        this.totalByTripOptions = {
            grid: { left: leftMargin, right: 30, top: 20, bottom: 30 },
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

    private renderBubble(): void {
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const points = this.trips.map(t => ({ name: t.name, x: t.durationDays, y: t.total, size: t.costPerDay }));
        this.bubbleOptions = this.chartTheme.bubbleOptions(points, {
            xLabel: 'Duración (días)',
            yLabel: `Costo total (${this.referenceAssetSymbol})`,
            formatX: v => `${v}`,
            formatY: fmt,
            formatSize: v => `Costo por día: ${fmt(v)}`,
        });
    }
}
