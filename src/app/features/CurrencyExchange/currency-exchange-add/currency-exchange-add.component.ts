import { Component, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CurrencyExchangeService } from '../services/currency-exchange.service';
import { AccountService } from '../../account/services/account.service';
import { AssetService } from '../../asset/services/asset.service';

@Component({
  selector: 'app-currency-exchange-add',
  templateUrl: './currency-exchange-add.component.html',
  styleUrls: ['./currency-exchange-add.component.css']
})
export class CurrencyExchangeAddComponent implements OnInit {
  currencyExchangeForm!: FormGroup;
  accounts: any[] = [];
  assets: any[] = [];
  formattedAmount: string = '';
  successMessage: string = '';
  errorMessage: string = '';


  constructor(
    private fb: FormBuilder,
    private currencyExchangeService: CurrencyExchangeService,
    private accountService: AccountService,
    private assetService: AssetService
  ) { }

  ngOnInit(): void {

    this.currencyExchangeForm = this.fb.group({
      date: ['', Validators.required],
      incomeAccount: ['', Validators.required],
      incomeAsset: ['', Validators.required],
      incomeAmount: ['', Validators.required],
      expenseAccount: ['', Validators.required],
      expenseAsset: ['', Validators.required],
      expenseAmount: ['', Validators.required]
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
    const formValues = this.currencyExchangeForm.value;
    formValues.incomeAmount = parseFloat(formValues.incomeAmount);
    formValues.expenseAmount = parseFloat(formValues.expenseAmount);
    formValues.incomeAsset = parseInt(formValues.incomeAsset);
    formValues.expenseAsset = parseInt(formValues.expenseAsset);
    formValues.incomeAccount = parseInt(formValues.incomeAccount);
    formValues.expenseAccount = parseInt(formValues.expenseAccount);

    this.errorMessage = '';

    if (formValues.date === '') {
      this.currencyExchangeForm.controls['date'].setErrors({ 'incorrect': true });
      return
    }

    console.log(formValues.expenseAccount);

    if (isNaN(formValues.expenseAsset)) {
      this.currencyExchangeForm.controls['expenseAsset'].setErrors({ 'incorrect': true });
      return
    }

    if (isNaN(formValues.expenseAccount)) {
      this.currencyExchangeForm.controls['expenseAccount'].setErrors({ 'incorrect': true });
      return
    }

    if (isNaN(formValues.expenseAmount) || formValues.expenseAmount <= 0) {
      this.currencyExchangeForm.controls['expenseAmount'].setErrors({ 'incorrect': true });
      return
    }

    if (isNaN(formValues.incomeAsset)) {
      this.currencyExchangeForm.controls['incomeAsset'].setErrors({ 'incorrect': true });
      return
    }

    if (isNaN(formValues.incomeAccount)) {
      this.currencyExchangeForm.controls['incomeAccount'].setErrors({ 'incorrect': true });
      return
    }

    if (formValues.expenseAsset === formValues.incomeAsset) {
      this.errorMessage = 'No se puede intercambiar la misma moneda';
      return
    }

    if (isNaN(formValues.incomeAmount) || formValues.incomeAmount <= 0) {
      this.currencyExchangeForm.controls['incomeAmount'].setErrors({ 'incorrect': true });
      return
    }


    if (this.currencyExchangeForm.invalid) {
      return;
    }

    const currencyExchange = {
      date: formValues.date,
      expenseAssetId: formValues.expenseAsset,
      expenseAccountId: formValues.expenseAccount,
      expenseAmount: formValues.expenseAmount,
      incomeAssetId: formValues.incomeAsset,
      incomeAccountId: formValues.incomeAccount,
      incomeAmount: formValues.incomeAmount
    }

    this.currencyExchangeService.createCurrencyExchange(currencyExchange)
      .subscribe(() => {
        this.successMessage = 'Intercambio de moneda creado correctamente';
        this.currencyExchangeForm.reset();

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      });
  }

}
