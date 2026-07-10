import { Component, OnDestroy } from '@angular/core';
import { PortfolioAddRequest } from '../models/portfolio-add-request.model';
import { PortfolioService } from '../services/portfolio.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-portfolio-add',
    templateUrl: './portfolio-add.component.html',
    styleUrls: ['./portfolio-add.component.css'],
    imports: [FormsModule, BackButtonComponent]
})
export class PortfolioAddComponent implements OnDestroy {

  model: PortfolioAddRequest;
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
    this.addPortfoliosubscription = this.portfolioService.addPortfolio(this.model)
      .subscribe({
        next: (response) => {
          this.toastService.success('Cartera creada correctamente');
          this.router.navigate(['/management/portfolio']);
        },
        error: (error) => {
          this.toastService.error('Error al crear la cartera');
        }
      })
  }
  ngOnDestroy(): void {
    this.addPortfoliosubscription?.unsubscribe();
  }

}
