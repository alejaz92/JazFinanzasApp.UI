import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

/**
 * Componente único de gráfico para toda la app, sobre ECharts.
 * Reemplaza a los `new Chart(ctx, {...})` / `echarts.init(document.getElementById(...))`
 * sueltos de cada reporte: acá vive la altura acotada y el resize observado,
 * una sola vez. El color y el formato de los datos los define quien arma
 * `options`, típicamente apoyándose en `ChartThemeService`.
 */
@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div #chartEl class="app-chart" [style.height.px]="height"></div>`,
  styleUrl: './chart.component.css',
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** Opciones de ECharts ya armadas (colores, datos, ejes, tooltip). */
  @Input({ required: true }) options!: EChartsOption;

  /** Alto fijo en píxeles — evita que un gráfico circular crezca sin control en pantallas anchas. */
  @Input() height = 320;

  @ViewChild('chartEl', { static: true }) private readonly chartEl!: ElementRef<HTMLDivElement>;

  private instance?: echarts.ECharts;
  private resizeObserver?: ResizeObserver;
  private initFrame?: number;

  ngAfterViewInit(): void {
    // El contenedor puede medir ancho 0 en este punto: Angular ya insertó el
    // elemento en el DOM pero el navegador todavía no corrió el layout (pasa
    // sobre todo dentro de un *ngIf que se activa en el mismo ciclo que carga
    // los datos). Se difiere a requestAnimationFrame, ya con el layout resuelto,
    // en vez de medir en falso y quedar con un gráfico de 0px para siempre.
    this.initFrame = requestAnimationFrame(() => {
      this.instance = echarts.init(this.chartEl.nativeElement);
      this.instance.setOption(this.options);
    });

    this.resizeObserver = new ResizeObserver(() => this.instance?.resize());
    this.resizeObserver.observe(this.chartEl.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && !changes['options'].firstChange && this.instance) {
      this.instance.setOption(this.options, true);
    }
  }

  ngOnDestroy(): void {
    if (this.initFrame !== undefined) cancelAnimationFrame(this.initFrame);
    this.resizeObserver?.disconnect();
    this.instance?.dispose();
  }
}
