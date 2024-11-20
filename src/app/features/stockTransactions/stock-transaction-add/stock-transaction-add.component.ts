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
  selectedTransactionType: string = '';
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
      transactionType: ['', Validators.required],
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
      console.log('1',this.fiatAccounts)
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

        if (this.selectedTransactionType === "I") {
          this.incomeAssets = this.stockAssets;
          if(this.selectedCommerceType === "General"){
            this.expenseAssets = this.fiatAssets;
          }
        } else if (this.selectedTransactionType === "E") {
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
      

        if (this.selectedTransactionType === "I") {
          this.incomeAccounts = this.stockAccounts;
          if(this.selectedCommerceType === "General"){
            this.expenseAccounts = this.fiatAccounts;
          }
        } else if (this.selectedTransactionType === "E") {
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

  onTransactionTypeChange(event: any) {
    this.selectedTransactionType = event.target.value;   
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



    if(this.selectedAssetType != '' && this.selectedTransactionType != '' && this.selectedCommerceType != ''){
      this.loadAccounts();
      this.loadAssets();   
    }
       
  }

  onSubmit() {

  }

}
