import { Pipe, PipeTransform } from '@angular/core';

// Cotización de origen/actual en las tablas de tenencias de Inversiones (2026-09-10): igual que
// currencyFiatFormat, pero con más decimales cuando el valor es menor a 1 — una moneda como ARS
// cotiza a una fracción de dólar por unidad (ej. 0,00065) y con 2 decimales fijos se veía "$ 0,00",
// mismo criterio ya aplicado a las cantidades de cripto en currencyInvestmentFormat.
@Pipe({ name: 'currencyQuoteFormat' })
export class CurrencyQuoteFormatPipe implements PipeTransform {

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';

    const abs = Math.abs(value);
    const decimals = abs > 0 && abs < 1 ? 8 : 2;

    const [whole, rawDecimal] = abs.toFixed(decimals).split('.');
    const decimal = decimals > 2 ? (rawDecimal.replace(/0+$/, '').padEnd(2, '0')) : rawDecimal;
    const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const sign = value < 0 ? '-' : '';

    return `$ ${sign}${formattedWhole},${decimal}`;
  }

}
