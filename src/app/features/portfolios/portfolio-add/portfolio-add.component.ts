import { Component, OnDestroy } from '@angular/core';
import { PortfolioAddRequest } from '../models/portfolio-add-request.model';
import { PortfolioService } from '../services/portfolio.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-portfolio-add',
  templateUrl: './portfolio-add.component.html',
  styleUrls: ['./portfolio-add.component.css']
})
export class PortfolioAddComponent implements OnDestroy {

  model: PortfolioAddRequest;
  private addPortfoliosubscription?: any;

  constructor(private portfolioService: PortfolioService, private router: Router) {
    this.model = {
      name: ''
    };
  }

  onFormSubmit() {
    this.addPortfoliosubscription = this.portfolioService.addPortfolio(this.model)
      .subscribe({
        next: (response) => {
          this.router.navigate(['/management/portfolio']);
        }
      })
  }
  ngOnDestroy(): void {
    this.addPortfoliosubscription?.unsubscribe();
  }

}
