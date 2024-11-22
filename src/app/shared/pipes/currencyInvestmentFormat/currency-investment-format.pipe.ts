import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyInvestmentFormat'
})
export class CurrencyInvestmentFormatPipe implements PipeTransform {

  transform(value: number): string {
    if (value === null || value === undefined) return '';

    // Verificamos si el valor es de tres cifras o más para limitar a 0 decimales y sino si es de 3 cifras o más para limitar a 2 decimales
    const isNormalNumber = Math.abs(value) >= 1 && Math.abs(value) < 1000;
    const isLargeNumber = Math.abs(value) >= 1000;
    const decimalPlaces = isNormalNumber ? 2 : isLargeNumber ? 0 : 10;  // 2 decimales para números grandes, 10 para otros

    // Formateamos el valor sin notación científica y con la cantidad de decimales indicada
    const valueFixed = value.toFixed(decimalPlaces);

    

    if (Math.abs(value) >= 1000) {
      // si el valor es mayor a mil, lo formateamos con separadores de miles
      let [whole] = valueFixed.split('.');
      const formattedWhole = Math.abs(parseInt(whole)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const sign = value < 0 && parseFloat(whole) !== 0 ? '-' : ''; // Agregar signo si es necesario
      return `${sign}${formattedWhole}`;
    }
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
