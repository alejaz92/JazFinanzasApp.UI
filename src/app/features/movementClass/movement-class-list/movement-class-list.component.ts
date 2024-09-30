import { Component, OnInit } from '@angular/core';
import { MovementClassService } from '../services/movement-class.service';
import { map, Observable } from 'rxjs';
import { MovementClass } from '../models/movementClass.model';

@Component({
  selector: 'app-movement-class-list',
  templateUrl: './movement-class-list.component.html',
  styleUrls: ['./movement-class-list.component.css']
})
export class MovementClassListComponent implements OnInit {
  movementClasses$?: Observable<MovementClass[]>;
  incomes$?: Observable<MovementClass[]>;
  expenses$?: Observable<MovementClass[]>;

  constructor(private movementClassService: MovementClassService) {

   }

  ngOnInit(): void {
    this.movementClasses$ = this.movementClassService.getAllMovementClasses();
    this.incomes$ = this.movementClasses$?.pipe(
      map(movementClasses => movementClasses.filter(movementClass => movementClass.incExp === 'Ingreso'))
    );
    this.expenses$ = this.movementClasses$?.pipe(
      map(movementClasses => movementClasses.filter(movementClass => movementClass.incExp === 'Gasto'))
    );
  }

}
