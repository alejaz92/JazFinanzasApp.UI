import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFiatFormat'
})
export class CurrencyFiatFormatPipe implements PipeTransform {

  transform(value: number): string {
    if (value === null || value === undefined) return '';
    
    // Formatear el número a moneda
    const [whole, decimal] = Math.abs(value).toFixed(2).split('.');
    const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Separador de miles con punto
    const formattedDecimal = decimal.replace('.', ','); // Separador decimal con coma

    const sign = value < 0 ? '-' : ''; // Agregar signo negativo si es necesario
    
    const currency = '$ ';

    return `${currency}${sign}${formattedWhole},${formattedDecimal}`; // Combinar todo
  }

}
