import { Component, OnInit, AfterViewInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TransactionService } from '../../transaction/services/transaction.service';
import { UserService } from '../../user/services/user.service';
import { CardTransactionsService } from '../../cardTransactions/services/card-transactions.service';
import { ReportService } from '../../report/services/report.service';
import { HomeStatsDTO } from '../../report/models/HomeStats.model';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Transaction } from '../../transaction/models/transaction.model';
import { CardTransactionPending } from '../../cardTransactions/models/cardTransactions-pending.model';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  isLoading: boolean = true;
  transactions: Transaction[] = [];
  cardTransactions: CardTransactionPending[] = [];
  userName: string = '';
  stocksChart: any;
  cryptosChart: any;
  mainReference: Asset | null = null;

  constructor(
    private transactionService: TransactionService,
    private userService: UserService,
    private cardTransactioneService: CardTransactionsService,
    private reportService: ReportService,
    private assetService: AssetService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Los gráficos se renderizarán después de que el DOM esté listo
  }

  loadData() {
    forkJoin({
      userData: this.userService.getUserData(),
      transactionsData: this.transactionService.getTransactions(1, 6),
      cardTransactionsData: this.cardTransactioneService.getPendingCardTransactions(),
      homeStatsData: this.reportService.getHomeStats()
    }).subscribe({
      next: ({ userData, transactionsData, cardTransactionsData, homeStatsData }) => {
        this.userName = userData.name;
        this.transactions = transactionsData.transactions;
        this.cardTransactions = cardTransactionsData.reverse();
        setTimeout(() => {
          this.loadMainReferences(homeStatsData);  
          
        });
      },
      complete: () => {
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar los datos:', err);
      }
    });
  }

  loadMainReferences(homeStatsData: HomeStatsDTO) {
    // Cargar las referencias 
    const stocksRef = this.assetService.getReferenceAssets().subscribe((data: any) => {
            
          //check for the mainReference asset
          this.mainReference = data.find((x: Asset) => x.isMainReference);
          this.renderHomeGraphs(homeStatsData); // Asegurarse de que el DOM esté listo
        });
  }
  
  renderHomeGraphs(data: HomeStatsDTO) {

    const ctx1 = document.getElementById('stocksHomeChart') as HTMLCanvasElement;
    if (ctx1) {
      const assetTypes = data.stockStatsGral.map(x => x.assetType);
      const stocksCurrentValues = data.stockStatsGral.map(x => x.actualValue);
      const stocksControlledColors = this.generateControlledColors(assetTypes.length);
  
      this.stocksChart = new Chart(ctx1, {
        type: 'pie',
        data: {
          labels: assetTypes,
          datasets: [{
            data: stocksCurrentValues,
            backgroundColor: stocksControlledColors,
            hoverOffset: 4
          }]
        },
        options: {
          plugins: {
            legend: { display: false, position: 'right' },
            title: { display: true, text: 'Distribución por Tipo de Activo (En ' + this.mainReference?.name + ')' },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => {
                  const total = stocksCurrentValues.reduce((a, b) => a + b, 0);
                  const percentage = ((Number(tooltipItem.raw) / total) * 100).toFixed(2);
                  const tipo = assetTypes[tooltipItem.dataIndex];
                  return `${tipo}: ${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(Number(tooltipItem.raw))} (${percentage}%)`;
                }
              }
            },
            datalabels: {
              display: true,
              color: 'white',
              anchor: 'center',
              align: 'center',
              font: {
                weight: 'bold',
                size: 12
              },
              formatter: (value, context) => {
                const total = context.chart.data.datasets[0].data.reduce((a, b) => (a as number) + (b as number), 0);
                const percentage = total ? ((Number(value) / Number(total)) * 100).toFixed(2) : '0.00';
                return Number(percentage) > 5 && context.chart.data.labels 
                  ? context.chart.data.labels[context.dataIndex] 
                  : '';
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }
  
    const ctx2 = document.getElementById('cryptosHomeChart') as HTMLCanvasElement;
    if (ctx2) {
      const cryptoAssets = data.cryptoStatsGral.map(x => x.assetName);
      const cryptosCurrentValues = data.cryptoStatsGral.map(x => x.actualValue);
      const cryptosControlledColors = this.generateControlledColors(cryptoAssets.length);
  
      this.cryptosChart = new Chart(ctx2, {
        type: 'pie',
        data: {
          labels: cryptoAssets,
          datasets: [{
            data: cryptosCurrentValues,
            backgroundColor: cryptosControlledColors,
            hoverOffset: 4
          }]
        },
        options: {
          plugins: {
            legend: { display: false, position: 'right' },
            title: { display: true, text: 'Distribución por Criptomoneda (En ' + this.mainReference?.name + ')' },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => {
                  const total = cryptosCurrentValues.reduce((a, b) => a + b, 0);
                  const percentage = ((Number(tooltipItem.raw) / total) * 100).toFixed(2);
                  const tipo = cryptoAssets[tooltipItem.dataIndex];
                  return `${tipo}: ${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(Number(tooltipItem.raw))} (${percentage}%)`;
                }
              }
            },
            datalabels: {
              display: true,
              color: 'white',
              anchor: 'center',
              align: 'center',
              font: {
                weight: 'bold',
                size: 12
              },
              formatter: (value, context) => {
                const total = context.chart.data.datasets[0].data.reduce((a, b) => (a as number) + (b as number), 0);
                const percentage = total ? ((Number(value) / Number(total)) * 100).toFixed(2) : '0.00';
                return Number(percentage) > 5 && context.chart.data.labels 
                  ? context.chart.data.labels[context.dataIndex] 
                  : '';
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }
  }
  

  generateControlledColors(quantity: number) {
    const colors = [];
    const step = 360 / quantity; // Divide el espectro de tonos uniformemente
  
    for (let i = 0; i < quantity; i++) {
      const hue = Math.floor(i * step); // Asigna un tono único basado en el índice
      const saturation = Math.floor(Math.random() * (100 - 70) + 70); // Mantén una saturación alta (70% a 100%)
      const lightness = Math.floor(Math.random() * (60 - 40) + 40); // Mantén colores balanceados (40% a 60%)
  
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      colors.push(color);
    }
    
    return colors;
  }
}
