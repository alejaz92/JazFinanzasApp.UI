import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFiatInputFormat'
})
export class CurrencyFiatInputFormatPipe implements PipeTransform {

  transform(value: number | string): string {
    if (value == null) return '';

    // Convertir a string si el valor es numérico
    let stringValue = value.toString();

    // Reemplazar comas o puntos incorrectos por punto como separador decimal
    stringValue = stringValue.replace(/,/g, '.').replace(/[^0-9.]/g, '');

    // Separar parte entera y decimal
    const [integerPart, decimalPart] = stringValue.split('.');

    // Formatear la parte entera con puntos como separador de miles
    let formattedValue = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Si hay parte decimal, la añadimos con coma
    if (decimalPart !== undefined) {
      formattedValue += ',' + decimalPart.substring(0, 2); // Máximo 2 decimales
    }



    return `${formattedValue}`;
  }

}
