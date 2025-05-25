import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { PortfolioExchangeService } from '../services/portfolio-exchange.service';
import { AccountService } from '../../account/services/account.service';
import { AssetService } from '../../asset/services/asset.service';
import { PortfolioService } from '../../portfolios/services/portfolio.service';

@Component({
  selector: 'app-portfolio-exchange-add',
  templateUrl: './portfolio-exchange-add.component.html',
  styleUrls: ['./portfolio-exchange-add.component.css']
})
export class PortfolioExchangeAddComponent implements  OnInit {
  portfolioExchangeForm: any;
  accounts: any[] = [];
  assets: any[] = [];
  assetTypes: any[] = [];
  portfolios: any[] = [];
  formattedAmount: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  selectedAssetType: string = '';
  
  constructor(
    private fb: FormBuilder,
    private portfolioExchangeService: PortfolioExchangeService,
    private accountService: AccountService,
    private assetService: AssetService,
    private portfolioService: PortfolioService
  ) { }
  
  ngOnInit(): void {
    this.portfolioExchangeForm = this.fb.group({
      date: ['', Validators.required],
      assetType: ['', Validators.required],
      account: ['', Validators.required],
      asset: ['', Validators.required],
      amount: ['', Validators.required],
      expensePortfolio: ['', Validators.required],
      incomePortfolio: ['', Validators.required]
    });

   
    this.loadAssetTypes();
    this.loadPortfolios();

  }

  loadAccounts() {
    this.accountService.getAccountByTypeId(Number(this.selectedAssetType)).subscribe((data: any) => {
      this.accounts = data;
    });
  }

  loadAssetTypes() {
    this.assetService.getAssetTypes().subscribe((data: any) => {
      
      this.assetTypes = data;
      console.log(this.assetTypes);
    });
  }

  loadPortfolios() {
    this.portfolioService.getAllPortfolios().subscribe((data: any) => {
      this.portfolios = data;
    });
  }

  loadAssets() {
    const selectedAssetType = this.portfolioExchangeForm.get('Asset').value;
    this.assetService.getAssignedAssets(Number(this.selectedAssetType)).subscribe((data: any) => {
      this.assets = data;
    });
  }

  onAssetTypeChange(event: any) {
    console.log(event.target);
    this.selectedAssetType = event.target;
    this.loadAssets();
    this.loadAccounts();
  }


  onSubmit() {
    if (this.portfolioExchangeForm.valid) {
      const portfolioExchange = {
        date: this.portfolioExchangeForm.get('date').value,
        accountId: this.portfolioExchangeForm.get('Account').value,
        assetId: this.portfolioExchangeForm.get('Asset').value,
        amount: this.portfolioExchangeForm.get('Amount').value,
        expensePortfolioId: this.portfolioExchangeForm.get('expensePortfolio').value,
        incomePortfolioId: this.portfolioExchangeForm.get('incomePortfolio').value
      };

      this.portfolioExchangeService.createCurrencyExchange(portfolioExchange).subscribe(
        (response) => {
          this.successMessage = 'Intercambio creado exitosamente';
          this.errorMessage = '';
          this.portfolioExchangeForm.reset();
        },
        (error) => {
          this.errorMessage = 'Error al crear el intercambio';
          this.successMessage = '';
        }
      );
    } else {
      this.errorMessage = 'Por favor, completa todos los campos requeridos.';
    } 
  }
  
  onCancel() {
    //return to portfolio exchange list
    window.history.back();
  }
}
