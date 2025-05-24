import { Component, OnInit } from '@angular/core';
import { PortfolioService } from '../services/portfolio.service';

@Component({
  selector: 'app-portfolio-list',
  templateUrl: './portfolio-list.component.html',
  styleUrls: ['./portfolio-list.component.css']
})
export class PortfolioListComponent implements OnInit {
  isLoading: boolean = true;
  portfolios: any[] | null = null;

  constructor(private PortfolioService: PortfolioService) { }

  ngOnInit(): void {
    this.PortfolioService.getAllPortfolios().subscribe((response) => {
      console.log(response);
      this.portfolios = response;
      this.isLoading = false;
    });
  }

  
  onDelete(portfolioId: number): void {
    if(portfolioId){
      const confirmed = window.confirm('¿Estás seguro de eliminar esta cartera?');
      if(confirmed) {
        this.PortfolioService.deletePortfolio(portfolioId)
        .subscribe({
          next: (response) => {
            alert('Cartera eliminada correctamente');
            this.ngOnInit();
          }, 
          error: (error) => {
            if (error.error == 'Portfolio is used in transactions') {
              alert('No se puede eliminar la cartera porque está siendo utilizado en transacciones');
            }
            
          }
        });
      }
    }    
  }

}
