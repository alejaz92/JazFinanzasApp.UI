import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountService } from '../../account/services/account.service';
import { StockTranctionsService } from '../services/stock-tranctions.service';
import { AssetService } from '../../asset/services/asset.service';
import { AssetTypeService } from '../../assetType/services/asset-type.service';

@Component({
  selector: 'app-stock-transaction-add',
  templateUrl: './stock-transaction-add.component.html',
  styleUrls: ['./stock-transaction-add.component.css']
})
export class StockTransactionAddComponent implements OnInit{
  stockTransactionForm!: FormGroup;
  selectedMovementType: string = '';
  selectedCommerceType: string = '';
  selectedAssetType: string = '';
  stockAccounts: any[] = [];
  fiatAccounts: any[] = [];
  stockAssets: any[] = [];
  assetTypes: any[] = [];
  incomeAccounts: any[] = [];
  incomeAssets: any[] = [];
  expenseAccounts: any[] = [];
  expenseAssets: any[] = [];
  fiatAssets: any[] = [];
  formattedAmount: string = '';
  successMessage: string = '';  


  constructor(
    private fb: FormBuilder,
    private stockTransactionService: StockTranctionsService,
    private accountService: AccountService,
    private assetService: AssetService,
    private assetTypeService: AssetTypeService
  ) { }

  ngOnInit(): void {
    this.stockTransactionForm = this.fb.group({
      movementType: ['', Validators.required],
      commerceType: ['', Validators.required],
      assetType: ['', Validators.required],
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

    this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
      this.fiatAccounts = data;
    });

    this.assetService.getAssetsByTypeName("Moneda").subscribe((data: any) => {
      this.fiatAssets = data;
    });

    this.loadAssetTypes();
    this.loadAssets();

  }  
  
  loadAssets() {    
    this.stockAssets = [];
    if(this.selectedAssetType != ''){ 
      this.assetService.getAssignedAssets(Number(this.selectedAssetType)).subscribe((data: any) => {
        this.stockAssets = data;

        if (this.selectedMovementType === "I") {
          this.incomeAssets = this.stockAssets;
          if(this.selectedCommerceType === "General"){
            this.expenseAssets = this.fiatAssets;
          }
        } else if (this.selectedMovementType === "E") {
          this.expenseAssets = this.stockAssets;
          if(this.selectedCommerceType === "General"){
            this.incomeAssets = this.fiatAssets;
          }
        }
      });
    }
  }

  loadAccounts() {    
    this.stockAccounts = [];
    
    if(this.selectedAssetType != ''){ 
      this.accountService.getAccountByTypeId(Number(this.selectedAssetType)).subscribe((data: any) => {
        this.stockAccounts = data;
      

        if (this.selectedMovementType === "I") {
          this.incomeAccounts = this.stockAccounts;
          if(this.selectedCommerceType === "General"){
            this.expenseAccounts = this.fiatAccounts;
          }
        } else if (this.selectedMovementType === "E") {
          this.expenseAccounts = this.stockAccounts;
          if(this.selectedCommerceType === "General"){
            this.incomeAccounts = this.fiatAccounts;
          }
        }
      });
    }
  } 

  loadAssetTypes() {
    this.assetTypeService.getAssetTypes('Bolsa').subscribe((data: any) => {
      this.assetTypes = data;
    });
  }

  onMovementTypeChange(event: any) {
    this.selectedMovementType = event.target.value;   
    this.updateCombos();
  }

  onCommerceTypeChange(event: any) {
    this.selectedCommerceType = event.target.value;    
    this.updateCombos();
  }  

  onAssetTypeChange(event: any) {
    this.selectedAssetType = event.target.value; 
    this.updateCombos();
  }

  updateCombos(){
    this.incomeAccounts = [];
    this.incomeAssets = [];
    this.expenseAccounts = [];
    this.expenseAssets = [];
    
    this.stockTransactionForm.get('incomeAccount')?.setValue('');
    this.stockTransactionForm.get('expenseAccount')?.setValue('');
    this.stockTransactionForm.get('incomeAsset')?.setValue('');
    this.stockTransactionForm.get('expenseAsset')?.setValue('');



    if(this.selectedAssetType != '' && this.selectedMovementType != '' && this.selectedCommerceType != ''){
      this.loadAccounts();
      this.loadAssets();   
    }
       
  }

  onSubmit() {
    const formValues = this.stockTransactionForm.value;
    formValues.incomeAmount = parseFloat(formValues.incomeAmount);
    formValues.expenseAmount = parseFloat(formValues.expenseAmount);
    formValues.incomeQuote = parseFloat(formValues.incomeQuote);
    formValues.expenseQuote = parseFloat(formValues.expenseQuote);
    formValues.incomeAccount = parseInt(formValues.incomeAccount);
    formValues.expenseAccount = parseInt(formValues.expenseAccount);
    formValues.incomeAsset = parseInt(formValues.incomeAsset);
    formValues.expenseAsset = parseInt(formValues.expenseAsset);

    if (formValues.movementType === '') {
      this.stockTransactionForm.controls['movementType'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.commerceType === '') {
      this.stockTransactionForm.controls['commerceType'].setErrors({ 'incorrect': true });
      return;
    }

    if(formValues.assetType === '') {
      this.stockTransactionForm.controls['assetType'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.date === '') {
      this.stockTransactionForm.controls['date'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.movementType === 'I') {
      if (formValues.incomeAccount === '') {
        this.stockTransactionForm.controls['incomeAccount'].setErrors({ 'incorrect': true });
        return;
      }
      if (formValues.incomeAsset === '') {
        this.stockTransactionForm.controls['incomeAsset'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.incomeAmount) || formValues.incomeAmount <= 0) {
        this.stockTransactionForm.controls['incomeAmount'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.incomeQuote) || formValues.incomeQuote <= 0) {
        this.stockTransactionForm.controls['incomeQuote'].setErrors({ 'incorrect': true });
        return;
      }
    }

    if (formValues.movementType === 'E') {
      if (formValues.expenseAccount === '') {
        this.stockTransactionForm.controls['expenseAccount'].setErrors({ 'incorrect': true });
        return;
      }
      if (formValues.expenseAsset === '') {
        this.stockTransactionForm.controls['expenseAsset'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.expenseAmount) || formValues.expenseAmount <= 0) {
        this.stockTransactionForm.controls['expenseAmount'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.expenseQuote) || formValues.expenseQuote <= 0) {
        this.stockTransactionForm.controls['expenseQuote'].setErrors({ 'incorrect': true });
        return;
      }
    }

    if(formValues.movementType === 'I' && formValues.commerceType === 'General') {
      if (formValues.expenseAccount === '') {
        this.stockTransactionForm.controls['expenseAccount'].setErrors({ 'incorrect': true });
        return;
      }
      if (formValues.expenseAsset === '') {
        this.stockTransactionForm.controls['expenseAsset'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.expenseAmount) || formValues.expenseAmount <= 0) {
        this.stockTransactionForm.controls['expenseAmount'].setErrors({ 'incorrect': true });
        return;
      }
    }

    if(formValues.movementType === 'E' && formValues.commerceType === 'General') {
      if (formValues.incomeAccount === '') {
        this.stockTransactionForm.controls['incomeAccount'].setErrors({ 'incorrect': true });
        return;
      }
      if (formValues.incomeAsset === '') {
        this.stockTransactionForm.controls['incomeAsset'].setErrors({ 'incorrect': true });
        return;
      }
      if (isNaN(formValues.incomeAmount) || formValues.incomeAmount <= 0) {
        this.stockTransactionForm.controls['incomeAmount'].setErrors({ 'incorrect': true });
        return;
      }
    }

    if (this.stockTransactionForm.invalid) {
      return;
    }

    const stockTransactionAdd = {
      stockMovementType: formValues.movementType,
      commerceType: formValues.commerceType,
      assetType: formValues.assetType,
      date: formValues.date,
      incomeAccountId: formValues.incomeAccount || null,
      expenseAccountId: formValues.expenseAccount || null,
      expenseAssetId: formValues.expenseAsset || null,
      incomeAssetId: formValues.incomeAsset || null,
      expenseQuantity: formValues.expenseAmount || null,
      incomeQuantity: formValues.incomeAmount || null,
      expenseQuotePrice: formValues.expenseQuote || null,
      incomeQuotePrice: formValues.incomeQuote || null,
      environment: 'Stock'
    };

    this.stockTransactionService.createStockTransaction(stockTransactionAdd).subscribe(() => {
      this.successMessage = 'Movimiento agregado correctamente';
      this.stockTransactionForm.reset();

      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    });
  }

}
