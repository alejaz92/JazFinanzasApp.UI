import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'commerceType'
})
export class CommerceTypePipe implements PipeTransform {

  transform(value: string): string {
    switch (value) {
        case 'Fiat/Crypto Commerce':
            return 'Comercio Fiat/Crypto';
        case 'Trading':
            return 'Trading';
        case 'BalanceAdj':
            return 'Ajuste de Saldos';
        default:
            return 'Unknown'; // O manejarlo de otra manera
    }
}


}
