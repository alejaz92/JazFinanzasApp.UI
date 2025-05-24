import { Component, OnDestroy, OnInit } from '@angular/core';
import { PortfolioAddRequest } from '../models/portfolio-add-request.model';
import { ActivatedRoute, Router } from '@angular/router';
import { PortfolioService } from '../services/portfolio.service';
import { Subscription } from 'rxjs';
import { Portfolio } from '../models/portfolio.model';

@Component({
  selector: 'app-portfolio-edit',
  templateUrl: './portfolio-edit.component.html',
  styleUrls: ['./portfolio-edit.component.css']
})
export class PortfolioEditComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  id: string | null = null;
  paramsSubscription?: Subscription;
  editPortfolioSubscription?: Subscription;
  portfolio?: Portfolio;

  constructor(private router: Router, private portfolioService: PortfolioService, private route: ActivatedRoute) { }

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
            this.router.navigateByUrl('/management/portfolio');
          }
        });
      }
    }


    ngOnDestroy(): void {
      this.paramsSubscription?.unsubscribe();
      this.editPortfolioSubscription?.unsubscribe();
    }

}
