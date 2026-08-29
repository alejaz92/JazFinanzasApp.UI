import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
    ViewChild,
    effect,
} from '@angular/core';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { ThemeService } from '../../../core/services/theme.service';
import { ChartThemeService } from '../../services/chart-theme.service';

// Componente único de gráfico para toda la app (T2, docs/plans/activos/plan-rediseno-reportes.md):
// altura acotada, resize, dispose, tema claro/oscuro y evento de click para drill-down,
// todo resuelto una sola vez acá en vez de copiado por cada componente de reporte.
@Component({
    selector: 'app-chart',
    standalone: true,
    template: `<div #chartHost class="app-chart-host" [style.height]="height"></div>`,
    styles: [`
        .app-chart-host {
            width: 100%;
        }
    `],
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input() options: EChartsOption = {};
    @Input() height = '320px';

    // Emite el dato del punto clickeado (params del evento 'click' de ECharts),
    // consumido por el drill-down universal de reportes (Fase 26 del plan).
    @Output() pointClick = new EventEmitter<unknown>();

    @ViewChild('chartHost', { static: true }) chartHost!: ElementRef<HTMLDivElement>;

    private chart?: echarts.ECharts;
    private resizeObserver?: ResizeObserver;
    private viewReady = false;

    constructor(
        private readonly themeService: ThemeService,
        private readonly chartThemeService: ChartThemeService,
    ) {
        // ECharts fija su tema en el init y no se puede mutar en caliente con
        // setOption; al togglear el tema, la instancia se reinicializa entera.
        effect(() => {
            this.themeService.theme();
            if (this.viewReady) this.initChart();
        });
    }

    ngAfterViewInit(): void {
        this.viewReady = true;
        this.initChart();

        this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
        this.resizeObserver.observe(this.chartHost.nativeElement);
    }

    ngOnChanges(changes: SimpleChanges): void {
        const optionsChange = changes['options'];
        if (optionsChange && !optionsChange.firstChange && this.chart) {
            this.chart.setOption(this.options, { notMerge: true });
        }
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
        this.chart?.dispose();
    }

    private initChart(): void {
        this.chart?.dispose();
        const theme = this.chartThemeService.buildEChartsTheme();
        this.chart = echarts.init(this.chartHost.nativeElement, theme);
        this.chart.setOption(this.options);
        this.chart.on('click', (params) => this.pointClick.emit(params));
    }
}
