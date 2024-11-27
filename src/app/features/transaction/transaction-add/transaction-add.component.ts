import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService } from '../services/transaction.service';
import { HttpClient } from '@angular/common/http';
import { AccountService } from '../../account/services/account.service';
import { AssetService } from '../../asset/services/asset.service';
import { TransactionClassService } from '../../transactionClass/services/transaction-class.service';


@Component({
  selector: 'app-transaction-add',
  templateUrl: './transaction-add.component.html',
  styleUrls: ['./transaction-add.component.css']
})
export class TransactionAddComponent implements OnInit{
  transactionForm!: FormGroup;
  selectedMovementType: string = '';
  accounts: any[] = [];
  incomeClasses: any[] = [];
  expenseClasses: any[] = [];
  assets: any[] = [];
  formattedAmount: string = '';
  successMessage: string = '';


  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService, 
    private accountService: AccountService,
    private assetService: AssetService,
    private transactionClasses: TransactionClassService) { }

    ngOnInit(): void {
      this.transactionForm = this.fb.group({
        movementType: ['', Validators.required],
        date: ['', Validators.required],
        asset: ['', Validators.required],
        amount: ['', Validators.required],
        detail: [''],
        incomeAccount: [''],
        expenseAccount: [''],
        incomeClass: [''],
        expenseClass: [''],
        incomeExchangeAccount: [''],
        expenseExchangeAccount: [''],
      
      });

      this.loadAccounts();
      this.loadAssets();
      this.loadTransactionClasses();
    }

    loadAccounts() {
      this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
        this.accounts = data;
      });
    }

    loadAssets() {
      this.assetService.getAssetsByTypeName("Moneda").subscribe((data: any) => {
        
        this.assets = data;
        
      });
    }

    loadTransactionClasses() {
      this.transactionClasses.getAllTransactionClasses().subscribe((data: any) => {
        this.incomeClasses = data.filter((x: any) => x.incExp === 'I');
        this.expenseClasses = data.filter((x: any) => x.incExp === 'E');
      });
    }

    onSubmit() {
      const formValues = this.transactionForm.value;
      
      if(formValues.movementType === '') {
        this.transactionForm.controls['movementType'].setErrors({ 'incorrect': true });
        return;
      }

      
      if(formValues.date === '') {
        this.transactionForm.controls['date'].setErrors({ 'incorrect': true });
        return;
      }

      if(formValues.asset === '') {
        this.transactionForm.controls['asset'].setErrors({ 'incorrect': true });
        return;
      }

      if (formValues.movementType === 'I') {
        if(formValues.incomeAccount === '') {
          this.transactionForm.controls['incomeAccount'].setErrors({ 'incorrect': true });
          return;
        }
        if(formValues.incomeClass === '') {
          this.transactionForm.controls['incomeClass'].setErrors({ 'incorrect': true });
          return;
        }

      }
      if (formValues.movementType === 'E') {
        if(formValues.expenseAccount === '') {
          this.transactionForm.controls['expenseAccount'].setErrors({ 'incorrect': true });
          return;
        }
        if(formValues.expenseClass === '') {
          this.transactionForm.controls['expenseClass'].setErrors({ 'incorrect': true });
          return;
        }
      }
      // if (formValues.movementType === 'EX') {
      //   if(formValues.incomeExchangeAccount === '') {
      //     this.transactionForm.controls['incomeExchangeAccount'].setErrors({ 'incorrect': true });
      //     return;
      //   }
      //   if(formValues.expenseExchangeAccount === '') {
      //     this.transactionForm.controls['expenseExchangeAccount'].setErrors({ 'incorrect': true });
      //     return;
      //   }
      // }


      if(isNaN(formValues.amount) || formValues.amount <= 0) {
        this.transactionForm.controls['amount'].setErrors({ 'incorrect': true });
        return;
      }

      //mapeo de los valores del formulario para el dto
      const transactionAdd = {
        // incomeAccountId: formValues.movementType === "I" ? parseInt(formValues.incomeAccount) : 
        //   formValues.movementType === "EX" ? parseInt(formValues.incomeExchangeAccount) : null,
        incomeAccountId: formValues.movementType === "I" ? parseInt(formValues.incomeAccount) : null,
        // expenseAccountId: formValues.movementType === "E" ? parseInt(formValues.expenseAccount) : 
        //   formValues.movementType === "EX" ? parseInt(formValues.expenseExchangeAccount) : null,
        expenseAccountId: formValues.movementType === "E" ? parseInt(formValues.expenseAccount) : null,
        assetId: parseInt(formValues.asset),
        date: formValues.date,
        movementType: formValues.movementType,
        transactionClassId: formValues.movementType === 'I' 
        ? (formValues.incomeClass ? parseInt(formValues.incomeClass, 10) : null)
        : (formValues.expenseClass ? parseInt(formValues.expenseClass, 10) : null),
        detail: formValues.detail,
        amount: Number(formValues.amount),
        quotePrice: 0
      }

      if (this.transactionForm.invalid) {
        return;
      }

      this.transactionService.createTransaction(transactionAdd).subscribe(() => {
      
       this.transactionForm.reset();
       this.successMessage = 'Movimiento creado con éxito';

       setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      });
    }

    onMovementTypeChange(event: any) {
      this.selectedMovementType = event.target.value;
    }  
}
