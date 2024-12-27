import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TransactionRefund } from '../models/transaction-refund.model';
import { Transaction } from '../models/transaction.model';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from '../services/transaction.service';
import { AccountService } from '../../account/services/account.service';

@Component({
  selector: 'app-transaction-refund',
  templateUrl: './transaction-refund.component.html',
  styleUrls: ['./transaction-refund.component.css']
})
export class TransactionRefundComponent implements OnInit, OnDestroy {
  refundForm!: FormGroup;
  id: string | null = null;
  paramsSubscription?: Subscription;
  refundSubscription?: Subscription;
  refund?: TransactionRefund;
  transaction?: Transaction;
  successMessage: string = '';
  accounts: any[] = []; 
  isLoading: boolean = true;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute, 
    private transactionService: TransactionService, 
    private accountService: AccountService,
    private router: Router) { }

  ngOnInit(): void {
    this.refundForm = this.fb.group({
      accountId: [null, Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [{ value: '', disabled: false }] // Permite que la fecha sea editable
    });

    this.loadAccounts();

    this.paramsSubscription = this.route.paramMap.subscribe({
      next: (params) => {        
        this.id = params.get('id');        
        if (this.id) {
          this.transactionService.getTransactionById(Number(this.id)).subscribe({
            next: (response) => {
              this.transaction = response;

              
              this.refundForm.patchValue({ // Actualiza el formulario
                accountId: this.transaction.accountId,
                date: this.transaction.date ? new Date(this.transaction.date).toISOString().split('T')[0] : '', // Asegúrate de que se formatee correctamente
              });
              this.isLoading = false;
            },
            error: (error) => {
              this.isLoading = false;
            }
          });
        } 
      }
    });
  }

  loadAccounts() {
    this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
      this.accounts = data;
    });
  }
  
  onFormSubmit(): void {

    if(this.refundForm.invalid) {
      return;
    } 

    const formValues = this.refundForm.value;
    let oldValue = this.transaction?.amount;
    if (oldValue === undefined) {
      oldValue = 0;
    }
    oldValue = Math.abs(oldValue);
    
    if (isNaN(formValues.amount) || formValues.amount <= 0) {
      this.refundForm.controls['amount'].setErrors({ 'incorrect': true });
      return;
    }
    

    if (formValues.amount > oldValue) {
      return;
    }
    
    this.refund = {
      accountId: formValues.accountId,
      amount: formValues.amount,
      date: formValues.date
    };
      

    if (this.id && this.refund) {  
      
      this.refundSubscription = this.transactionService.refundTransaction(Number(this.id), this.refund).subscribe({
        next: (response) => {
          this.successMessage = 'Reembolso realizado con éxito';
          setTimeout(() => {
            this.router.navigate(['/transactions']);
          }, 2000);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.refundSubscription?.unsubscribe();
  }

  selectAll(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }
}
