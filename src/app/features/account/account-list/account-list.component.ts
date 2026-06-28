import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from '../models/account.model';
import { AccountService } from '../services/account.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-account-list',
    templateUrl: './account-list.component.html',
    styleUrls: ['./account-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, FormsModule]
})
export class AccountListComponent implements OnInit {
  isLoading: boolean = true;
  accounts: any[] | null = null;
  searchTerm: string = '';
  constructor(private AccountService: AccountService) {

   }

  ngOnInit(): void {


    this.AccountService.getAllAccounts().subscribe((response) => {
      this.accounts = response;

      this.isLoading = false;
    });


  }

  get filteredAccounts(): any[] {
    if (!this.accounts) return [];
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.accounts;
    return this.accounts.filter(account => account.name.toLowerCase().includes(term));
  }
  
  onDelete(accountId: number): void {
    if(accountId){
      const confirmed = window.confirm('¿Estás seguro de eliminar esta cuenta?');
      if(confirmed) {

        this.AccountService.deleteAccount(accountId)
        .subscribe({
          next: (response) => {
            alert('Cuenta eliminada correctamente');
            this.ngOnInit();
          }, 
          error: (error) => {
            if (error.error == 'Account is used in transactions') {
              alert('No se puede eliminar la cuenta porque está siendo utilizada en transacciones');
            }
            
          }
        });
      }
    }    
  }

  updateAssetTypes(accountId: number): void {
  }

}
