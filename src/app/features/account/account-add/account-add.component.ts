import { Component, OnDestroy } from '@angular/core';
import { AccountAddRequest } from '../models/account-add-request.model';
import { Subscription } from 'rxjs';
import { AccountService } from '../services/account.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-add',
  templateUrl: './account-add.component.html',
  styleUrls: ['./account-add.component.css']
})
export class AccountAddComponent implements OnDestroy {

  model: AccountAddRequest;
  private addCategorysubscription?: Subscription;

  constructor(private accountService: AccountService, 
    private router: Router
  ) {
    this.model = {
      name: ''
    };
  }

  onFormSubmit() {
    this.addCategorysubscription = this.accountService.addAccount(this.model)
      .subscribe({
        next: (response) => {
          this.router.navigate(['/management/account']);
        }
      })
  }
  ngOnDestroy(): void {
    this.addCategorysubscription?.unsubscribe();
  }

}
