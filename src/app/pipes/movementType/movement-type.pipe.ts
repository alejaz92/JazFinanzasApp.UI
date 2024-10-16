import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'movementType'
})
export class MovementTypePipe implements PipeTransform {

  transform(value: string): string {
        switch (value) {
            case 'I':
                return 'Ingreso';
            case 'E':
                return 'Egreso';
            default:
                return 'Unknown'; // O manejarlo de otra manera
        }
    }

}
