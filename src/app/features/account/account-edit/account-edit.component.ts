import { Component, OnDestroy, OnInit } from '@angular/core';
import { Account } from '../models/account.model';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../services/account.service';
import { AccountAddRequest } from '../models/account-add-request.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-account-edit',
    templateUrl: './account-edit.component.html',
    styleUrls: ['./account-edit.component.css'],
    imports: [LoadingComponent, NgIf, FormsModule, BackButtonComponent]
})
export class AccountEditComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  id: string | null = null;
  paramsSubcription?: Subscription;
  editAccountSubscription?: Subscription;
  account?: Account;

  constructor(private route: ActivatedRoute, private accountService: AccountService,
    private router: Router,
    private toastService: ToastService) {  }

    ngOnInit(): void {
      this.paramsSubcription = this.route.paramMap.subscribe({
        next: (params) => {
          this.id = params.get('id');

          if (this.id) {
            // Get data from server

            this.accountService.getAccountById(Number(this.id)).subscribe({
              next: (response) => {
                this.account = response;

                this.isLoading = false;
              },
              error: (error) => {
                this.toastService.error('Error al cargar la cuenta');
                this.isLoading = false;
              }
            });
          }
        }
      });
    }

    onFormSubmit(): void {
      const accountUpdateRequest: AccountAddRequest = {
        name: this.account?.name ?? ''
      };

      if (this.id) {
        this.editAccountSubscription = this.accountService.updateAccount(Number(this.id),
        accountUpdateRequest).subscribe({
          next: (response) => {
            this.toastService.success('Cuenta actualizada correctamente');
            this.router.navigateByUrl('/management/account');
          },
          error: (error) => {
            this.toastService.error('Error al actualizar la cuenta');
          }
        });
      }
    }

    ngOnDestroy(): void {
      this.paramsSubcription?.unsubscribe();
      this.editAccountSubscription?.unsubscribe
    }

}
