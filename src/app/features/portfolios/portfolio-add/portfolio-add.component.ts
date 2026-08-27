import { Component, OnDestroy } from '@angular/core';
import { PortfolioAddRequest } from '../models/portfolio-add-request.model';
import { PortfolioService } from '../services/portfolio.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';

@Component({
    selector: 'app-portfolio-add',
    templateUrl: './portfolio-add.component.html',
    styleUrls: ['./portfolio-add.component.css'],
    imports: [FormsModule, BackButtonComponent, SubmitButtonComponent]
})
export class PortfolioAddComponent implements OnDestroy {

  model: PortfolioAddRequest;
  isSubmitting = false;
  private addPortfoliosubscription?: any;

  constructor(
    private portfolioService: PortfolioService,
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

    this.addPortfoliosubscription = this.portfolioService.addPortfolio(this.model)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.toastService.success('Cartera creada correctamente');
          this.router.navigate(['/management/portfolio']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastService.error('Error al crear la cartera');
        }
      })
  }
  ngOnDestroy(): void {
    this.addPortfoliosubscription?.unsubscribe();
  }

}
