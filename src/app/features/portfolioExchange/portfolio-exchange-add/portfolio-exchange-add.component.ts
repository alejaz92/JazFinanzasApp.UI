import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PortfolioExchangeService } from '../services/portfolio-exchange.service';
import { AccountService } from '../../account/services/account.service';
import { AssetService } from '../../asset/services/asset.service';
import { PortfolioService } from '../../portfolios/services/portfolio.service';
import { NgIf, NgFor } from '@angular/common';
import { InvestmentInputDirective } from '../../../shared/directives/investment-input.directive';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-portfolio-exchange-add',
    templateUrl: './portfolio-exchange-add.component.html',
    styleUrls: ['./portfolio-exchange-add.component.css'],
    imports: [NgIf, FormsModule, ReactiveFormsModule, NgFor, InvestmentInputDirective, BackButtonComponent]
})
export class PortfolioExchangeAddComponent implements  OnInit {
  portfolioExchangeForm: any;
  accounts: any[] = [];
  assets: any[] = [];
  assetTypes: any[] = [];
  portfolios: any[] = [];
  formattedAmount: string = '';
  selectedAssetType: string = '';

  constructor(
    private fb: FormBuilder,
    private portfolioExchangeService: PortfolioExchangeService,
    private accountService: AccountService,
    private assetService: AssetService,
    private portfolioService: PortfolioService,
    private toastService: ToastService
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
    });
  }

  loadPortfolios() {
    this.portfolioService.getAllPortfolios().subscribe((data: any) => {
      this.portfolios = data;
    });
  }

  loadAssets() {
    const selectedAssetType = this.portfolioExchangeForm.get('assetType').value;
    this.assetService.getAssignedAssets(Number(this.selectedAssetType)).subscribe((data: any) => {
      this.assets = data;
    });
  }

  onAssetTypeChange(event: any) {
    //console.log(event.target.value);
    this.selectedAssetType = event.target.value;
    this.loadAssets();
    this.loadAccounts();
  }


  onSubmit() {
    if (this.portfolioExchangeForm.valid) {
      const portfolioExchange = {
        date: this.portfolioExchangeForm.get('date').value,
        accountId: this.portfolioExchangeForm.get('account').value,
        assetId: this.portfolioExchangeForm.get('asset').value,
        amount: this.portfolioExchangeForm.get('amount').value,
        expensePortfolioId: this.portfolioExchangeForm.get('expensePortfolio').value,
        incomePortfolioId: this.portfolioExchangeForm.get('incomePortfolio').value
      };

      this.portfolioExchangeService.createCurrencyExchange(portfolioExchange).subscribe(
        (response) => {
          this.toastService.success('Intercambio creado exitosamente');
          this.portfolioExchangeForm.reset();
        },
        (error) => {
          this.toastService.error('Error al crear el intercambio');
        }
      );
    } else {
      this.toastService.error('Por favor, completa todos los campos requeridos.');
    }
  }
}
