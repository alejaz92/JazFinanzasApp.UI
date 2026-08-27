import { Component, OnDestroy } from '@angular/core';
import { AccountAddRequest } from '../models/account-add-request.model';
import { Subscription } from 'rxjs';
import { AccountService } from '../services/account.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';

@Component({
    selector: 'app-account-add',
    templateUrl: './account-add.component.html',
    styleUrls: ['./account-add.component.css'],
    imports: [FormsModule, BackButtonComponent, SubmitButtonComponent]
})
export class AccountAddComponent implements OnDestroy {

  model: AccountAddRequest;
  isSubmitting = false;
  private addCategorysubscription?: Subscription;

  constructor(private accountService: AccountService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.model = {
      name: ''
    };
  }

  onFormSubmit() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.addCategorysubscription = this.accountService.addAccount(this.model)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.toastService.success('Cuenta creada correctamente');
          this.router.navigate(['/management/account']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastService.error('Error al crear la cuenta');
        }
      })
  }
  ngOnDestroy(): void {
    this.addCategorysubscription?.unsubscribe();
  }

}
