import { Pipe, PipeTransform } from '@angular/core';

// Blanco o negro según la luminancia del color de fondo — mismo criterio que ya usaba
// features/report/balance/balance.component.ts, ahora reutilizable donde haga falta pintar
// una tarjeta con el color propio de un activo/moneda (WCAG relative luminance).
@Pipe({ name: 'contrastText' })
export class ContrastTextPipe implements PipeTransform {

  transform(backgroundColor: string | null | undefined): string {
    if (!backgroundColor) return '#000000';

    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

}
