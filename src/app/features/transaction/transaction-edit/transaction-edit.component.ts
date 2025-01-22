import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from '../services/transaction.service';
import { Subscription } from 'rxjs';
import { Transaction } from '../models/transaction.model';
import { FormGroup } from '@angular/forms';
import { AssetService } from '../../asset/services/asset.service';
import { AccountService } from '../../account/services/account.service';
import { TransactionClassService } from '../../transactionClass/services/transaction-class.service';

@Component({
  selector: 'app-transaction-edit',
  templateUrl: './transaction-edit.component.html',
  styleUrls: ['./transaction-edit.component.css']
})
export class TransactionEditComponent  implements OnInit, OnDestroy{
  transactionForm!: FormGroup;
  id: string | null = null;
  assets: any[] = [];
  accounts: any[] = [];
  transactionClasses: any[] = []; 
  paramsSubcription?: Subscription;
  editTransactionSubscription?: Subscription;
  transaction?: Transaction;
  successMessage: string = '';
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private assetsService: AssetService,
    private accountService: AccountService,
    private transactionClassService: TransactionClassService,
    private router: Router
    ) {  }

  ngOnInit(): void {

    this.loadAssets();
    this.loadAccounts();
    
    
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
              
              this.loadTransactionClasses();

              this.transaction.amount = Math.abs(this.transaction.amount);
            
              
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

  loadAssets() {
    this.assetsService.getAssetsByTypeName("Moneda").subscribe((data: any) => {
      this.assets = data;
    });
  }

  loadAccounts() {
    this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
      this.accounts = data;
    });
  }

  loadTransactionClasses() {
    this.transactionClassService.getAllTransactionClasses().subscribe((data: any) => {

      if (this.transaction?.movementType === 'Ingreso') {
        this.transactionClasses = data.filter((x: any) => x.incExp === 'I');
      } else {
        this.transactionClasses = data.filter((x: any) => x.incExp === 'E');
      }
    });
  }

  onFormSubmit(): void {
    const formValues = this.transaction;

    console.log(formValues?.date)

    if (!formValues) {
      return;
    }

    if(isNaN(formValues.amount) || formValues.amount <= 0) {
      
      // alerta de que el monto no es valido

      alert('El monto no es valido');     

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

  updateDate(newDate: string) {
    if (this.transaction) {
      this.transaction.date = new Date(newDate); // Convertir el string a un objeto Date
    }
  }

}
