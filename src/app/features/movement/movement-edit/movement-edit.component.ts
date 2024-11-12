import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovementService } from '../services/movement.service';
import { Subscription } from 'rxjs';
import { Movement } from '../models/movement.model';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-movement-edit',
  templateUrl: './movement-edit.component.html',
  styleUrls: ['./movement-edit.component.css']
})
export class MovementEditComponent  implements OnInit, OnDestroy{
  movementForm!: FormGroup;
  id: string | null = null;
  paramsSubcription?: Subscription;
  editMovementSubscription?: Subscription;
  movement?: Movement;
  successMessage: string = '';

  constructor(private route: ActivatedRoute, private movementService: MovementService, private router: Router) {  }

  ngOnInit(): void {
    
    this.paramsSubcription = this.route.paramMap.subscribe({
      next: (params) => {        
        this.id = params.get('id');        
        if (this.id) {
          // Get data from server          
          this.movementService.getMovementById(Number(this.id)).subscribe({
            
            next: (response) => {

              this.movement = response;

              

              if(this.movement?.movementType === 'I') {
                this.movement.movementType = 'Ingreso';
              } else if (this.movement) {
                this.movement.movementType = 'Egreso';
              }
              
              this.movement.amount = Math.abs(this.movement.amount);              
            }
          });
        } 
      }
    });
  }

  onFormSubmit(): void {
    const formValues = this.movementForm.value;
    if(isNaN(formValues.amount) || formValues.amount <= 0) {
      this.movementForm.controls['amount'].setErrors({ 'incorrect': true });
      return;
    }


    if (this.id && this.movement) {
      this.editMovementSubscription = this.movementService.updateMovement(Number(this.id), this.movement).subscribe({
        next: (response) => {
          this.router.navigateByUrl('/movements');
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.paramsSubcription?.unsubscribe();
    this.editMovementSubscription?.unsubscribe();
  }

}
