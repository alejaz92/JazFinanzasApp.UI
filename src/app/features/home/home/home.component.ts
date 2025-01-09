import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../transaction/services/transaction.service';
import { Transaction } from '../../transaction/models/transaction.model';
import { UserService } from '../../user/services/user.service';
import { CardTransactionsService } from '../../cardTransactions/services/card-transactions.service';
import { CardTransactionPending } from '../../cardTransactions/models/cardTransactions-pending.model';
import { ReportService } from '../../report/services/report.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { HomeStatsDTO } from '../../report/models/HomeStats.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit{
  transactions: Transaction[] = [];
  cardTransactions: CardTransactionPending[] = [];
  userName: string = '';
  stocksChart: any;
  cryptosChart: any;

  constructor(
      private transactionService: TransactionService,
      private userService: UserService,
      private cardTransactioneService: CardTransactionsService  ,
      private reportService: ReportService
    ) { }

  ngOnInit(): void {
    this.loadUsername();
    this.loadTransactions();
    this.loadCardTransactions();
    this.loadInvestmentsGraphs();
  }

  loadUsername(): void {
    this.userService.getUserData()
      .subscribe(response => {
        this.userName = response.name;
      },
      error => {
        console.error('Error al obtener el nombre de usuario', error);
      });
  }

  loadTransactions() {
    this.transactionService.getTransactions(1, 6)
      .subscribe(response => {
        this.transactions = response.transactions;

        
      });
  }

  loadCardTransactions() {
    this.cardTransactioneService.getPendingCardTransactions()
      .subscribe(response => {
        this.cardTransactions = response.reverse();
        
      });
  }

  loadInvestmentsGraphs() {
    this.reportService.getHomeStats()
      .subscribe(response => {

        this.renderHomeGraphs(response);
        

      });
  }

  renderHomeGraphs(data: HomeStatsDTO) {
    const ctx1 = document.getElementById('stocksHomeChart') as HTMLCanvasElement;

        if(!ctx1) return;

        console.log(data);

        var assetTypes = data.stockStatsGral.map(x => x.assetType);
        var stocksCurrentValues = data.stockStatsGral.map(x => x.actualValue);
        
        var stocksControlledColors = this.generateControlledColors(assetTypes.length);

        this.stocksChart =  new Chart(ctx1, {
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
              legend: {
                display: false,
                position: 'right'
              },
              title: {
                display: true,
                text: 'Distribución por Tipo de Activo (En Dólares)'
              },
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
                align: 'center',
                anchor: 'center',
                font: {
                  weight: 'bold'
                },
                formatter: (value, context) => {
                  const total = context.chart.data.datasets[0].data.reduce((a, b) => (typeof a === 'number' && typeof b === 'number' ? a + b : 0), 0);
                  const percentage = total ? ((value / Number(total)) * 100).toFixed(2) : '0.00';
                  return Number(percentage) > 5 && context.chart.data.labels ? context.chart.data.labels[context.dataIndex] : '';
                }
              }
            }
          },
          plugins: [ChartDataLabels]
        });

        const ctx2 = document.getElementById('cryptosHomeChart') as HTMLCanvasElement;

        if(!ctx2) return;

        var cryptoAssets = data.cryptoStatsGral.map(x => x.assetName);
        var cryptosCurrentValues = data.cryptoStatsGral.map(x => x.actualValue);

        var cryptosControlledColors = this.generateControlledColors(cryptoAssets.length);

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
              legend: {
                display: false,
                position: 'right'
              },
              title: {
                display: true,
                text: 'Distribución por Criptomoneda (En Dólares)'
              },
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
                align: 'center',
                anchor: 'center',
                font: {
                  weight: 'bold'
                },
                formatter: (value, context) => {
                  const total = context.chart.data.datasets[0].data.reduce((a, b) => (typeof a === 'number' && typeof b === 'number' ? a + b : 0), 0);
                  const percentage = total ? ((value / Number(total)) * 100).toFixed(2) : '0.00';
                  return Number(percentage) > 5 && context.chart.data.labels ? context.chart.data.labels[context.dataIndex] : '';
                }
              }
            }
          },
          plugins: [ChartDataLabels]
        });
        
  }

  generateControlledColors(quantity: number) {
    var colors = [];

    for (var i = 0; i < quantity; i++) {
      var hue = Math.floor(Math.random() * 360); // Varía el tono entre 0 y 360 grados (todos los colores)
      var saturation = Math.floor(Math.random() * (100 - 60) + 60);  // Saturación alta (60% a 100%) para colores vivos
      var lightness = Math.floor(Math.random() * (70 - 40) + 40);  // Evita colores muy oscuros o muy claros (40% a 70%)

      var color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      colors.push(color);

    }
    return colors;
  }
}
