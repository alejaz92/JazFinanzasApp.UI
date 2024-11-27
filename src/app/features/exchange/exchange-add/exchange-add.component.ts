import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService } from '../../transaction/services/transaction.service';
import { AccountService } from '../../account/services/account.service';
import { AssetService } from '../../asset/services/asset.service';

@Component({
  selector: 'app-exchange-add',
  templateUrl: './exchange-add.component.html',
  styleUrls: ['./exchange-add.component.css']
})
export class ExchangeAddComponent implements OnInit {
  transactionForm!: FormGroup;
  accounts: any[] = [];
  assets: any[] = [];
  formattedAmount: string = '';
  successMessage: string = '';
  errorMessage: string = '';


  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService, 
    private accountService: AccountService,
    private assetService: AssetService
  ) { }

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      date: ['', Validators.required],
      asset: ['', Validators.required],
      amount: ['', Validators.required],
      detail: [''],
      incomeAccount: [''],
      expenseAccount: ['']
    
    });

    this.loadAccounts();
    this.loadAssets();
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

  onSubmit() {
    const formValues = this.transactionForm.value;
    this.errorMessage = '';


    if(formValues.date === '') {
      this.transactionForm.controls['date'].setErrors({'incorrect': true});
      return
    }

    if(formValues.asset === '') {
      this.transactionForm.controls['asset'].setErrors({'incorrect': true});
      return
    }

    if(formValues.expenseAccount === '') {
      this.transactionForm.controls['expenseAccount'].setErrors({'incorrect': true});
      return
    }

    if(formValues.incomeAccount === '') {
      this.transactionForm.controls['incomeAccount'].setErrors({'incorrect': true});
      return
    }

    if (formValues.incomeAccount === formValues.expenseAccount) {
      this.errorMessage = 'No se puede intercambiar entre la misma cuenta';
      return
    }

    if(isNaN(formValues.amount) || formValues.amount <= 0) {
      this.transactionForm.controls['amount'].setErrors({ 'incorrect': true });
      return;
    }

    const transactionAdd = {
      incomeAccountId: parseInt(formValues.incomeAccount),
      expenseAccountId: parseInt(formValues.expenseAccount),
      assetId: parseInt(formValues.asset),
      date: formValues.date,
      movementType: 'EX',
      transactionClassId: null,
      detail: formValues.detail,
      amount: Number(formValues.amount),
      quotePrice: 0,
    }

    if(this.transactionForm.invalid) {
      return;
    }

    this.transactionService.createTransaction(transactionAdd).subscribe(() => {
      this.transactionForm.reset();
      this.successMessage = 'Intercambio creado con éxito';
      

      setTimeout(() => {
        this.successMessage = '';

      }, 3000);
    });

  }


}
