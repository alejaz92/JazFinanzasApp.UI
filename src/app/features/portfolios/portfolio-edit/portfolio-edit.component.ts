import { Component, OnDestroy, OnInit } from '@angular/core';
import { PortfolioAddRequest } from '../models/portfolio-add-request.model';
import { ActivatedRoute, Router } from '@angular/router';
import { PortfolioService } from '../services/portfolio.service';
import { Subscription } from 'rxjs';
import { Portfolio } from '../models/portfolio.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-portfolio-edit',
    templateUrl: './portfolio-edit.component.html',
    styleUrls: ['./portfolio-edit.component.css'],
    imports: [LoadingComponent, NgIf, FormsModule, BackButtonComponent]
})
export class PortfolioEditComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  id: string | null = null;
  paramsSubscription?: Subscription;
  editPortfolioSubscription?: Subscription;
  portfolio?: Portfolio;

  constructor(
    private router: Router,
    private portfolioService: PortfolioService,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
      this.paramsSubscription = this.route.paramMap.subscribe({
        next: (params) => {
          this.id = params.get('id');

          if (this.id) {
            // Get data from server

            this.portfolioService.getPortfolioById(Number(this.id)).subscribe({
              next: (response) => {
                this.portfolio = response;

                this.isLoading = false;
              },
              error: () => {
                this.isLoading = false;
              }
            });
          }
        }
      });
    }


    onFormSubmit(): void {
      const accountUpdateRequest: PortfolioAddRequest = {
        name: this.portfolio?.name ?? ''
      };

      if (this.id) {
        this.editPortfolioSubscription = this.portfolioService.updatePortfolio(Number(this.id),
        accountUpdateRequest).subscribe({
          next: (response) => {
            this.toastService.success('Cartera actualizada correctamente');
            this.router.navigateByUrl('/management/portfolio');
          },
          error: () => {
            this.toastService.error('Error al actualizar la cartera');
          }
        });
      }
    }


    ngOnDestroy(): void {
      this.paramsSubscription?.unsubscribe();
      this.editPortfolioSubscription?.unsubscribe();
    }

}
