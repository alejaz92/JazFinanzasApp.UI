import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardTransactionsService } from '../services/card-transactions.service';
import { ActivatedRoute, Router } from '@angular/router';
import { first, Subscription } from 'rxjs';
import { RecurrentCardTransactionPut } from '../models/CardTransaction-recurrent.model';
import { DatePipe, NgIf } from '@angular/common';
import { CurrencyInputDirective } from '../../../shared/directives/currency-input.directive';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-card-transactions-edit-recurrent',
    templateUrl: './card-transactions-edit-recurrent.component.html',
    styleUrls: ['./card-transactions-edit-recurrent.component.css'],
    providers: [DatePipe],
    imports: [NgIf, FormsModule, ReactiveFormsModule, CurrencyInputDirective, BackButtonComponent]
})
export class CardTransactionsEditRecurrentComponent implements OnInit{
  editRecurrentForm!: FormGroup;
  action: string = 'Edit';
  id: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cardTransactionsService: CardTransactionsService,
    private datePipe: DatePipe,
    private toastService: ToastService
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
        this.toastService.error('Error al cargar el movimiento recurrente');
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
        this.toastService.success('Movimiento de tarjeta actualizado correctamente');
        this.router.navigateByUrl('/cardTransactions');
      },
      (error) => {
        this.toastService.error('Error al actualizar el movimiento recurrente');
      }
    )
  }

  
}
