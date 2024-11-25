import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CardTransactionsService } from '../services/card-transactions.service';
import { ActivatedRoute, Router } from '@angular/router';
import { first, Subscription } from 'rxjs';
import { RecurrentCardTransactionPut } from '../models/CardTransaction-recurrent.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-card-transactions-edit-recurrent',
  templateUrl: './card-transactions-edit-recurrent.component.html',
  styleUrls: ['./card-transactions-edit-recurrent.component.css'],
  providers: [DatePipe]
})
export class CardTransactionsEditRecurrentComponent implements OnInit{
  successMessage: string = '';
  editRecurrentForm!: FormGroup;
  action: string = 'Edit';
  id: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cardTransactionsService: CardTransactionsService,
    private datePipe: DatePipe
  ) {
    const today = new Date();

    this.editRecurrentForm = this.fb.group({
      id: [{value: '', disabled: true}],
      date: [{value: '', disabled: true}],
      firstInstallment: [{value: '', disabled: true}],
      card: [{value: '', disabled: true}],
      description: [{value: '', disabled: true}],
      currentAmount: [{value: '', disabled: true}],
      action: ['Edit'],
      newDate: [today.toISOString().substring(0, 10)],
      newAmount: [''],
    })
   }

  ngOnInit(): void {
    

    
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTransactionDetails(this.id);    
    this.onActionChange();
  }

  loadTransactionDetails(id: number) {
    this.cardTransactionsService.getRecurrentCardTransactions(id).subscribe(
      (data) => {

        const formattedDate = this.datePipe.transform(data.date, 'dd/MM/yyyy');
        const formmattedAmount = this.formatCurrency(data.amount);

        const formattedFirstInstallment = this.datePipe.transform(data.firstInstallment, 'MM/yyyy');


        this.editRecurrentForm.patchValue({
          id: data.id,
          date: formattedDate,
          firstInstallment: formattedFirstInstallment,
          card: data.card,
          description: data.description,
          currentAmount: formmattedAmount,
        });
      },
      (error) => {
        console.error('Error loading recurrent card transaction details', error);
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  }

  onSubmit() {  

    const formValue = {
      newDate: this.editRecurrentForm.get('newDate')?.value,
      isUpdate: true
    } as RecurrentCardTransactionPut;

    if (this.action === 'Edit') {
      formValue.isUpdate = true
      formValue.newAmount = Number(this.editRecurrentForm.get('newAmount')?.value);
    }
    else {
      formValue.isUpdate = false;
      formValue.newAmount = 0;
    }

    const newDateString = this.editRecurrentForm.get('newDate')?.value;
    const newDate = new Date(newDateString + 'T00:00:00');    
    newDate.setDate(1);

    const oldDateString = '01/' + this.editRecurrentForm.get('firstInstallment')?.value;
    const [day, month, year] = oldDateString.split('/');
    const oldDate = new Date(`${year}-${month}-${day}T00:00:00`);

    if (newDate <= oldDate) {
      this.editRecurrentForm.controls['newDate'].setErrors({ 'incorrect': true });
      return;
    }      



    if (formValue.isUpdate && (isNaN(Number(formValue.newAmount)) || Number(formValue.newAmount) <= 0)) {
      
      this.editRecurrentForm.controls['newAmount'].setErrors({ 'incorrect': true });
      return;
    }


    this.cardTransactionsService.editRecurrentCardTransaction(this.id, formValue).subscribe(
      (response) => {

        this.successMessage = 'Movimiento de tarjeta actualizado correctamente';
        setTimeout(() => {
          this.router.navigateByUrl('/cardTransactions');
        }, 3000);
      }, 
      (error) => {
        console.error('Error updating recurrent card transaction', error);
      }
    )
  }

  
}
