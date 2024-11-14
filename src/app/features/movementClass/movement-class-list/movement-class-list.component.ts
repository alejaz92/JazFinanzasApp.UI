import { Component, OnInit } from '@angular/core';
import { MovementClassService} from '../services/movement-class.service';

@Component({
  selector: 'app-movement-class-list',
  templateUrl: './movement-class-list.component.html',
  styleUrls: ['./movement-class-list.component.css']
})
export class MovementClassListComponent implements OnInit {
  incomeClasses: any[] | null = null;
  expenseClasses: any[] | null = null;
  restrictedClasses = ['Ajuste Saldos Ingreso', 'Ajuste Saldos Egreso', 'Gastos Tarjeta',
    'Ingreso Inversiones','Inversiones'];


  constructor(private movementClassService: MovementClassService) { }

  ngOnInit(): void {
    this.loadMovementClasses();  
  }

  loadMovementClasses(): void {
    this.movementClassService.getAllMovementClasses().subscribe((data) => {

      
      this.incomeClasses = data.filter((x) => x.incExp === 'I');
      this.expenseClasses = data.filter((x) => x.incExp === 'E' );
    });
  }

  canEditOrDelete(name: string) : boolean {
    return !this.restrictedClasses.includes(name);
  };

  onDelete(movementClassId: number): void {
    if(movementClassId){
      const confirmed = window.confirm('¿Estás seguro de eliminar esta clase de movimiento?');
      if(confirmed) {
        this.movementClassService.deleteMovementClass(movementClassId)
        .subscribe({
          next: (response) => {
            alert('Clase de movimiento eliminada correctamente');
            this.loadMovementClasses();
          }
        });
      }
    }
  }

}
