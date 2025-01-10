import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from '../models/account.model';
import { AccountService } from '../services/account.service';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.css']
})
export class AccountListComponent implements OnInit {
  isLoading: boolean = true;
  accounts: any[] | null = null;
  constructor(private AccountService: AccountService) {

   }

  ngOnInit(): void {

   
    this.AccountService.getAllAccounts().subscribe((response) => {
      this.accounts = response;

      this.isLoading = false;
    });

    
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
          }
        });
      }
    }    
  }

  updateAssetTypes(accountId: number): void {
  }

}
