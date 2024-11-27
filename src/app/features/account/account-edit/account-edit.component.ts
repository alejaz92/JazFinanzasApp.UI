import { Component, OnDestroy, OnInit } from '@angular/core';
import { Account } from '../models/account.model';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../services/account.service';
import { AccountAddRequest } from '../models/account-add-request.model';

@Component({
  selector: 'app-account-edit',
  templateUrl: './account-edit.component.html',
  styleUrls: ['./account-edit.component.css']
})
export class AccountEditComponent implements OnInit, OnDestroy {

  id: string | null = null;
  paramsSubcription?: Subscription;
  editAccountSubscription?: Subscription;
  account?: Account;

  constructor(private route: ActivatedRoute, private accountService: AccountService, 
    private router: Router) {  }

    ngOnInit(): void {
      this.paramsSubcription = this.route.paramMap.subscribe({
        next: (params) => {
          this.id = params.get('id');
  
          if (this.id) {
            // Get data from server
            
            this.accountService.getAccountById(Number(this.id)).subscribe({
              next: (response) => {
                this.account = response;
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
            this.router.navigateByUrl('/management/account');
          }
        });
      }
    }

    ngOnDestroy(): void {
      this.paramsSubcription?.unsubscribe();
      this.editAccountSubscription?.unsubscribe
    }

}
