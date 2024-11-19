import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CryptoMovementService } from '../services/crypto-movement.service';
import { AccountService } from '../../account/services/account.service';
import { AssetService } from '../../asset/services/asset.service';

@Component({
  selector: 'app-crypto-movement-add',
  templateUrl: './crypto-movement-add.component.html',
  styleUrls: ['./crypto-movement-add.component.css']
})
export class CryptoMovementAddComponent implements OnInit {
  cryptoMovementForm!: FormGroup;
  selectedMovementType: string = '';
  selectedCommerceType: string = '';
  cryptoAccounts: any[] = [];
  fiatAccounts: any[] = [];
  cryptoAssets: any[] = [];
  commerceTypes: any[] = [];
  incomeAccounts: any[] = [];
  incomeAssets: any[] = [];
  expenseAccounts: any[] = [];
  expenseAssets: any[] = [];
  fiatAssets: any[] = [];
  formattedAmount: string = '';
  successMessage: string = '';


  constructor(
    private fb: FormBuilder,
    private cryptoMovementService: CryptoMovementService,
    private accountService: AccountService,
    private assetService: AssetService,
  ) { }

  ngOnInit(): void {
    this.cryptoMovementForm = this.fb.group({
      movementType: ['', Validators.required],
      commerceType: ['', Validators.required],
      date: ['', Validators.required],
      incomeAccount: [''],
      expenseAccount: [''],
      incomeAsset: [''],
      expenseAsset: [''],
      incomeAmount: [''],
      expenseAmount: [''],
      incomeQuote: [''],
      expenseQuote: ['']
    });

    this.loadAccounts();
    this.loadAssets();
  }

  loadAccounts() {
    this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
      this.fiatAccounts = data;
    });
    this.accountService.getAccountByTypeName("Criptomoneda").subscribe((data: any) => {
      this.cryptoAccounts = data;
    });
  }

  loadAssets() {
    this.assetService.getAssetsByTypeName("Moneda").subscribe((data: any) => {
      this.fiatAssets = data;
    });
    this.assetService.getAssetsByTypeName("Criptomoneda").subscribe((data: any) => {
      this.cryptoAssets = data;
    });
  }

  onMovementTypeChange(event: any) {
    this.selectedMovementType = event.target.value;

    this.cryptoMovementForm.get('commerceType')?.setValue('');
    this.selectedCommerceType = '';
    

    this.commerceTypes = [];
    if (this.selectedMovementType === 'I' || this.selectedMovementType === 'E') {
      this.commerceTypes = [
        { id: 'BalancesAdj', name: 'Ajuste de Saldos' },
        { id: 'Fiat/Crypto Commerce', name: 'Comercio Fiat/Cripto' }
      ];
    } else if (this.selectedMovementType === 'EX') {
      this.commerceTypes = [
        { id: 'Trading', name: 'Trading' }
      ];
    }
  }

  onCommerceTypeChange(event: any) {
    this.selectedCommerceType = event.target.value;

    this.incomeAccounts = [];
    this.incomeAssets = [];
    this.expenseAccounts = [];
    this.expenseAssets = [];

    if (this.selectedMovementType === 'I') {
      this.incomeAccounts = this.cryptoAccounts;
      this.incomeAssets = this.cryptoAssets;
      if (this.selectedCommerceType === 'Fiat/Crypto Commerce') {
        this.expenseAccounts = this.fiatAccounts;
        this.expenseAssets = this.fiatAssets;
      }
    } else if (this.selectedMovementType === 'E') {

      this.expenseAccounts = this.cryptoAccounts;
      this.expenseAssets = this.cryptoAssets;

      if (this.selectedCommerceType === 'Fiat/Crypto Commerce') {
        this.incomeAccounts = this.fiatAccounts;
        this.incomeAssets = this.fiatAssets;
      }
    } else if (this.selectedMovementType === 'EX') {
      this.incomeAccounts = this.cryptoAccounts;
      this.incomeAssets = this.cryptoAssets;
      this.expenseAccounts = this.cryptoAccounts;
      this.expenseAssets = this.cryptoAssets;
    }

  }

  onSubmit() {
    const formValues = this.cryptoMovementForm.value;
    formValues.incomeAmount = parseFloat(formValues.incomeAmount);
    formValues.expenseAmount = parseFloat(formValues.expenseAmount);
    formValues.incomeQuote = parseFloat(formValues.incomeQuote);
    formValues.expenseQuote = parseFloat(formValues.expenseQuote);
    formValues.incomeAccount = parseInt(formValues.incomeAccount);
    formValues.expenseAccount = parseInt(formValues.expenseAccount);
    formValues.incomeAsset = parseInt(formValues.incomeAsset);
    formValues.expenseAsset = parseInt(formValues.expenseAsset);


    if (formValues.movementType === '') {
      this.cryptoMovementForm.controls['movementType'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.commerceType === '') {
      this.cryptoMovementForm.controls['commerceType'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.date === '') {
      this.cryptoMovementForm.controls['date'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.movementType === 'I' || formValues.movementType === 'EX') {
      if (formValues.incomeAccount === '') {
        this.cryptoMovementForm.controls['incomeAccount'].setErrors({ 'incorrect': true });
        return;
      }
      if (formValues.incomeAsset === '') {
        this.cryptoMovementForm.controls['incomeAsset'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.incomeAmount) || formValues.incomeAmount <= 0) {
        console.log(formValues.incomeAmount);
        this.cryptoMovementForm.controls['incomeAmount'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.incomeQuote) || formValues.incomeQuote <= 0) {
        this.cryptoMovementForm.controls['incomeQuote'].setErrors({ 'incorrect': true });
        return;
      }
    }

    if (formValues.movementType === 'E' || formValues.movementType === 'EX') {
      if (formValues.expenseAccount === '') {
        this.cryptoMovementForm.controls['expenseAccount'].setErrors({ 'incorrect': true });
        return;
      }
      if (formValues.expenseAsset === '') {
        this.cryptoMovementForm.controls['expenseAsset'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.expenseAmount) || formValues.expenseAmount <= 0) {
        this.cryptoMovementForm.controls['expenseAmount'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.expenseQuote) || formValues.expenseQuote <= 0) {
        this.cryptoMovementForm.controls['expenseQuote'].setErrors({ 'incorrect': true });
        return;
      }
    }

    if(formValues.movementType === 'I' && formValues.commerceType === 'Fiat/Crypto Commerce') {
      if (formValues.expenseAccount === '') {
        this.cryptoMovementForm.controls['expenseAccount'].setErrors({ 'incorrect': true });
        return;
      }
      if (formValues.expenseAsset === '') {
        this.cryptoMovementForm.controls['expenseAsset'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.expenseAmount) || formValues.expenseAmount <= 0) {
        this.cryptoMovementForm.controls['expenseAmount'].setErrors({ 'incorrect': true });
        return;
      }
    }

    if(formValues.movementType === 'E' && formValues.commerceType === 'Fiat/Crypto Commerce') {
      if (formValues.incomeAccount === '') {
        this.cryptoMovementForm.controls['incomeAccount'].setErrors({ 'incorrect': true });
        return;
      }
      if (formValues.incomeAsset === '') {
        this.cryptoMovementForm.controls['incomeAsset'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.incomeAmount) || formValues.incomeAmount <= 0) {
        this.cryptoMovementForm.controls['incomeAmount'].setErrors({ 'incorrect': true });
        return;
      }
    }

    if (this.cryptoMovementForm.invalid) {
      return;
    }
    
    const movementAdd = {
      movementType: formValues.movementType,
      commerceType: formValues.commerceType,
      date: formValues.date,
      incomeAccountId: formValues.incomeAccount || null,
      expenseAccountId: formValues.expenseAccount || null,
      incomeAssetId: formValues.incomeAsset || null,
      expenseAssetId: formValues.expenseAsset || null,
      incomeQuantity: formValues.incomeAmount || null,
      expenseQuantity: formValues.expenseAmount || null,
      incomeQuotePrice: formValues.incomeQuote || null,
      expenseQuotePrice: formValues.expenseQuote  || null,
      environment: 'Crypto'  
    };

    console.log(movementAdd);

    this.cryptoMovementService.createCryptoMovement(movementAdd)
      .subscribe(() => {

        this.successMessage = 'Movimiento agregado correctamente';
        this.cryptoMovementForm.reset();

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      });
  }

}
