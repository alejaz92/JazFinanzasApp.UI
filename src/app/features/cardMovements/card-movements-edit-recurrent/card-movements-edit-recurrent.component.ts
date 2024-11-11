import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CardMovementsService } from '../services/card-movements.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RecurrentCardMovementPut } from '../models/CardMovement-recurrent.model';

@Component({
  selector: 'app-card-movements-edit-recurrent',
  templateUrl: './card-movements-edit-recurrent.component.html',
  styleUrls: ['./card-movements-edit-recurrent.component.css']
})
export class CardMovementsEditRecurrentComponent implements OnInit{
  successMessage: string = '';
  editRecurrentForm!: FormGroup;
  action: string = 'Edit';
  id: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cardMovementsService: CardMovementsService,
  ) {
    const today = new Date();

    this.editRecurrentForm = this.fb.group({
      id: [{value: '', disabled: true}],
      date: [{value: '', disabled: true}],
      card: [{value: '', disabled: true}],
      description: [{value: '', disabled: true}],
      currentAmount: [{value: '', disabled: true}],
      action: ['Edit'],
      newDate: [today],
      newAmount: [''],
    })
   }

  ngOnInit(): void {
    

    
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadMovementDetails(this.id);    
    this.onActionChange();
  }

  loadMovementDetails(id: number) {
    this.cardMovementsService.getRecurrentCardMovements(id).subscribe(
      (data) => {

        console.log(data);
        this.editRecurrentForm.patchValue({
          id: data.id,
          date: data.date,
          card: data.card,
          description: data.description,
          currentAmount: data.amount,
        });
      },
      (error) => {
        console.error('Error loading recurrent card movement details', error);
      }
    );
  }

  onActionChange() {
    this.editRecurrentForm.get('action')?.valueChanges.subscribe((value) => {
      this.action = value;
      const newAmountControl = this.editRecurrentForm.get('newAmount');
      if (value === 'Edit') {
        newAmountControl?.enable();
      } else {
        newAmountControl?.disable();
        newAmountControl?.reset();
      }
    });      
  }

  onSubmit() {
    // crear form values usando el modelo RecurrentCardMovementPut
    const formValue = this.editRecurrentForm.value as RecurrentCardMovementPut;

    this.cardMovementsService.editRecurrentCardMovement(this.id, formValue).subscribe(
      (response) => {
        this.successMessage = 'Movimiento de tarjeta actualizado correctamente';
        setTimeout(() => {
          this.router.navigateByUrl('/cardMovements');
        }, 3000);
      }, 
      (error) => {
        console.error('Error updating recurrent card movement', error);
      }
    )
  }
}
