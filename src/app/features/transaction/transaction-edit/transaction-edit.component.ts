import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from '../services/transaction.service';
import { Subscription } from 'rxjs';
import { Transaction } from '../models/transaction.model';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-transaction-edit',
  templateUrl: './transaction-edit.component.html',
  styleUrls: ['./transaction-edit.component.css']
})
export class TransactionEditComponent  implements OnInit, OnDestroy{
  transactionForm!: FormGroup;
  id: string | null = null;
  paramsSubcription?: Subscription;
  editTransactionSubscription?: Subscription;
  transaction?: Transaction;
  successMessage: string = '';

  constructor(private route: ActivatedRoute, private transactionService: TransactionService, private router: Router) {  }

  ngOnInit(): void {
    
    this.paramsSubcription = this.route.paramMap.subscribe({
      next: (params) => {        
        this.id = params.get('id');        
        if (this.id) {
          // Get data from server          
          this.transactionService.getTransactionById(Number(this.id)).subscribe({
            
            next: (response) => {

              this.transaction = response;

              

              if(this.transaction?.movementType === 'I') {
                this.transaction.movementType = 'Ingreso';
              } else if (this.transaction) {
                this.transaction.movementType = 'Egreso';
              }
              
              this.transaction.amount = Math.abs(this.transaction.amount);              
            }
          });
        } 
      }
    });
  }

  onFormSubmit(): void {
    const formValues = this.transactionForm.value;
    if(isNaN(formValues.amount) || formValues.amount <= 0) {
      this.transactionForm.controls['amount'].setErrors({ 'incorrect': true });
      return;
    }


    if (this.id && this.transaction) {
      this.editTransactionSubscription = this.transactionService.updateTransaction(Number(this.id), this.transaction).subscribe({
        next: (response) => {
          this.router.navigateByUrl('/transactions');
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.paramsSubcription?.unsubscribe();
    this.editTransactionSubscription?.unsubscribe();
  }

}
