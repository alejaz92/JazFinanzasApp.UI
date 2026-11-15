import { Component, Input } from '@angular/core';
import { SpendingMeasure } from '../../services/report-context.service';

// Una línea fija debajo del título de cada reporte de gasto de Ingresos y Egresos que dice con qué medida está contando (plan-ingresos-egresos-por-fecha-de-compra.md,
// decisión C1). Cambia con el interruptor de la barra, así nunca queda a la vista la explicación de una medida que no se está mirando. Por etiqueta,
// que mide siempre por compra, le pasa 'purchase' fijo.
@Component({
    selector: 'app-spending-measure-notice',
    standalone: true,
    templateUrl: './spending-measure-notice.component.html'
})
export class SpendingMeasureNoticeComponent {
    @Input({ required: true }) measure!: SpendingMeasure;
}
