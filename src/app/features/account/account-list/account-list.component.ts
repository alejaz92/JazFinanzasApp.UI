import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from '../models/account.model';
import { AccountService } from '../services/account.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-account-list',
    templateUrl: './account-list.component.html',
    styleUrls: ['./account-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, FormsModule, ConfirmModalComponent]
})
export class AccountListComponent implements OnInit {
  isLoading: boolean = true;
  accounts: any[] | null = null;
  searchTerm: string = '';

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private accountIdToDelete: number | null = null;

  constructor(private AccountService: AccountService, private toastService: ToastService) {

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
    if (!accountId) return;
    this.accountIdToDelete = accountId;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.accountIdToDelete) return;

    this.AccountService.deleteAccount(this.accountIdToDelete)
      .subscribe({
        next: (response) => {
          this.toastService.success('Cuenta eliminada correctamente');
          this.ngOnInit();
        },
        error: (error) => {
          if (error.error == 'Account is used in transactions') {
            this.toastService.error('No se puede eliminar la cuenta porque está siendo utilizada en transacciones');
          }
        }
      });

    this.accountIdToDelete = null;
  }

  updateAssetTypes(accountId: number): void {
  }

}
