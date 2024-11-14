import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyInvestmentFormat'
})
export class CurrencyInvestmentFormatPipe implements PipeTransform {

  transform(value: number): string {
    if (value === null || value === undefined) return '';

    // Verificamos si el valor es de tres cifras o más para limitar a 2 decimales
    const isLargeNumber = Math.abs(value) >= 100;
    const decimalPlaces = isLargeNumber ? 2 : 10;  // 2 decimales para números grandes, 10 para otros

    // Formateamos el valor sin notación científica y con la cantidad de decimales indicada
    const valueFixed = value.toFixed(decimalPlaces);

    // Dividimos en parte entera y decimal
    let [whole, decimal] = valueFixed.split('.');

    // Eliminamos ceros innecesarios a la derecha de la parte decimal
    decimal = decimal.replace(/0+$/, '');

    // Formateamos la parte entera con separadores de miles
    const formattedWhole = Math.abs(parseInt(whole)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    const sign = value < 0 && parseFloat(whole + '.' + decimal) !== 0 ? '-' : ''; // Agregar signo si es necesario

    // Combinamos la parte entera y decimal, usando coma como separador decimal si hay decimales
    return `${sign}${formattedWhole}${decimal ? ',' + decimal : ''}`;
  }
}
