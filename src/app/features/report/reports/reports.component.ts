import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ReportService } from '../services/report.service';
import { IncExpStats } from '../models/IncExpStats.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);
import { CardService } from '../../card/services/card.service';
import { Card } from '../../card/models/card.model';
import { CardStats } from '../models/CardStats.model';
import { CardTransactionPaymentList } from '../../cardTransactions/models/CardTransactionPayment-List.model';
import { AssetType } from '../../account/models/assetType.model';
import { AssetTypeService } from '../../assetType/services/asset-type.service';
import { StockStatsDTO, StockStatsListDTO } from '../models/StockStats.model';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { CryptoGralStatsDTO } from '../models/CryptoGralStats.model';
import { Asset } from '../../asset/models/asset.model';
import { AssetService } from '../../asset/services/asset.service';
import { CryptoStatsDTO, InvestmentTransactionsStatsDTO } from '../models/CryptoStats.model';
import * as echarts from 'echarts';




@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  isLoading: boolean = true;
  assetsDB1: any[] = [];
  selectedAssetIdDB1: number = 0;
  selectedAssetDB1: Asset | null = null;
  selectedMonthDB1: string = '';
  selectedMonthDB2: string = '';
  selectedCardDB3: number = 0;
  selectedAssetTypeDB4: number = 0;
  selectedCryptoDB6: number = 0;
  includeStables: boolean = false;
  cardTransactionsDTO: CardTransactionPaymentList[] = [];
  cards: Card[] = [];
  assetTypes: AssetType[] = [];
  cryptos: Asset[] = [];
  incExpStats: IncExpStats | null = null;
  incExpPesosStats: IncExpStats | null = null;
  stocksStatsDTO: StockStatsListDTO[] = [];
  cryptoGralStatsDTO: StockStatsListDTO[] = [];
  cryptoTransactionsStatsDTO: InvestmentTransactionsStatsDTO[] = [];
  db1Graph1: Chart | undefined;
  db1Graph2: Chart | undefined;
  db1Graph3: Chart | undefined;
  db1Graph4: Chart | undefined;
  db2Graph1: Chart | undefined;
  db2Graph2: Chart | undefined;
  db2Graph3: Chart | undefined;
  db2Graph4: Chart | undefined;
  db3Graph1: Chart | undefined;
  db3Graph2: Chart | undefined;
  db4Graph1: Chart | undefined;
  db4Graph2: Chart | undefined;
  db4Graph3: Chart | undefined;
  db5Graph1: Chart | undefined;
  db5Graph2: Chart | undefined;
  db5Graph3: Chart | undefined;
  db6Graph1: Chart | undefined;
  db6Graph2: Chart | undefined;
  db6Graph3: Chart | undefined;
  mainReference: Asset | null = null;
  viewAux: boolean = false;
  isLoadingGraph: boolean = false;
  selectedTab: string = 'incExp-tab';


  constructor(
    private reportService: ReportService,
    private cardService: CardService,
    private assetTypeService: AssetTypeService,
    private assetService: AssetService 
  ) {}

  ngOnInit(): void {

    this.viewAux = false;
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    this.selectedMonthDB1 = `${year}-${month}`;
    this.selectedMonthDB2 = `${year}-${month}`;

    
    this.loadAssetsDB1();
    
    this.loadCards();
    this.loadAssetTypes();
    this.loadCryptos();    
    
    
  }

  onTabChange(selectedTabId: string) {
    if (this.selectedTab === selectedTabId) {
      return;
    }
    else {
      this.selectedTab = selectedTabId;
    }

    if (selectedTabId === 'incExp-tab') {
        this.loadIncExpStats();
        return;      
    }
    if (selectedTabId === 'cards-tab') {
      this.loadCardStats();
      return;
    }
    if (selectedTabId === 'stocks-tab') {
      if (this.selectedAssetTypeDB4 == 0) {
        this.viewAux = false;
        return;
      }
      else {
        this.loadStockStats();
        return;
      }
    }
    if(selectedTabId === 'cryptosGral-tab') { 
      this.loadCryptoGralStats();
      return;
    }
    if (selectedTabId === 'crypto-tab') {
      this.loadCryptoStats();
    }

  }

  loadAssetsDB1() {
    this.assetService.getReferenceAssets().subscribe((data: any) => {
        
      //check for the mainReference asset
      this.mainReference = data.find((x: Asset) => x.isMainReference);

      this.assetsDB1 = data;      
      this.isLoading = false;
    });
  }

  loadCards() {
    this.cardService.getAllCards().subscribe(response => {
      this.cards = response;
    });
  }

  loadAssetTypes() {
    this.assetTypeService.getAssetTypes('BOLSA').subscribe(response => {
      this.assetTypes = response;
    });
  }

  loadIncExpStats() {

    // search in asssets for selectedAssetDB1
    this.selectedAssetDB1 = this.assetsDB1.find(x => x.id == this.selectedAssetIdDB1);

    if (this.selectedAssetDB1 == null) {
      this.viewAux = false;
      return;
    }

    //transform this.selectedMonthDB1 to Date
    if (this.selectedMonthDB1 != null && this.selectedAssetIdDB1 != 0) {

      



      this.isLoadingGraph = true;
      this.viewAux = false;

      this.reportService.getIncExpStats(this.selectedMonthDB1, this.selectedAssetDB1.id)
        .subscribe(response => {
          
          this.incExpStats = response;

          this.isLoadingGraph = false;
          this.viewAux = true;


          setTimeout(() => {
            this.renderDB1();

          }, 0);

        });
    }
  }

  renderDB1() {
    //graph1
    const rawDataInc = this.incExpStats?.classIncomeStats || [];
    const totalInc = rawDataInc.reduce((sum, item) => sum + item.amount, 0);
    const thresholdInc = totalInc * 0.05; // 5% del total

    let filteredDataInc = rawDataInc.filter(item => item.amount >= thresholdInc);
    const otherTotalInc = rawDataInc
      .filter(item => item.amount < thresholdInc)
      .reduce((sum, item) => sum + item.amount, 0);

    if (otherTotalInc > 0) {
      filteredDataInc.push({ transactionClass: 'Otros', amount: otherTotalInc });
    }

    const labelsInc = filteredDataInc.map(item => item.transactionClass);
    const dataValuesInc = filteredDataInc.map(item => item.amount);


    const ctx1 = document.getElementById('incomeByClassChart') as HTMLCanvasElement;
    
    if (!ctx1) return;
    
    this.db1Graph1?.destroy();

    this.db1Graph1 = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: labelsInc, // Etiquetas del eje X
        datasets: [{
          label: 'Ingresos en ' + this.selectedAssetDB1?.symbol,
          data: dataValuesInc, // Datos del eje Y
          backgroundColor: 'rgba(75, 192, 192, 0.2)',  // Verde claro
          borderColor: 'rgba(75, 192, 192, 1)',        // Verde oscuro
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          datalabels: {
            color: '#000',
            formatter: (value: number) => {
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: this.selectedAssetDB1?.symbol }).format(value);
            },
            anchor: 'end',
            align: 'top',
            offset: 4
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: number) => {
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: this.selectedAssetDB1?.symbol }).format(value);
              }
            }
          }
        }
      } as ChartConfiguration['options']
    });

    
    // graph 2

    const rawDataExp = this.incExpStats?.classExpenseStats || [];
    const totalExp = rawDataExp.reduce((sum, item) => sum + item.amount, 0);
    const thresholdExp = totalExp * 0.05; // 5% del total

    let filteredDataExp = rawDataExp.filter(item => item.amount >= thresholdExp);
    const otherTotalExp = rawDataExp
      .filter(item => item.amount < thresholdExp)
      .reduce((sum, item) => sum + item.amount, 0);

    if (otherTotalExp > 0) {
      filteredDataExp.push({ transactionClass: 'Otros', amount: otherTotalExp });
    }

    const labelsExp = filteredDataExp.map(item => item.transactionClass);
    const dataValuesExp = filteredDataExp.map(item => item.amount);


    const ctx2 = document.getElementById('expenseByClassChart') as HTMLCanvasElement;

    if (!ctx2) return;

    this.db1Graph2?.destroy();
    

    this.db1Graph2 = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: labelsExp, // Etiquetas del eje X
        datasets: [{
          label: 'Egresos en ' + this.selectedAssetDB1?.symbol,
          data: dataValuesExp, // Datos del eje Y
          backgroundColor: 'rgba(255, 99, 132, 0.2)',  // Rojo claro
          borderColor: 'rgba(255, 99, 132, 1)',        // Rojo oscuro
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          datalabels: {
            color: '#000',
            formatter: (value: number) => {
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: this.selectedAssetDB1?.symbol }).format(value);
            },
            anchor: 'end',
            align: 'top',
            offset: 4
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: number) => {
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: this.selectedAssetDB1?.symbol }).format(value);
              }
            }
          }
        }
      } as ChartConfiguration['options']
    });


    const ctx3 = document.getElementById('incomeLast6MonthsChart') as HTMLCanvasElement;

    if (!ctx3) return;

    this.db1Graph3?.destroy();
    

    this.db1Graph3 = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: this.incExpStats?.monthIncomeStats.map(item => {
          const date = new Date(item.month);
          return date.toLocaleString('es-AR', { month: 'long' }).charAt(0).toUpperCase() + date.toLocaleString('es-AR', { month: 'long' }).slice(1);
        }), // Etiquetas del eje X
        datasets: [{
          label: 'Ingresos en ' + this.selectedAssetDB1?.symbol,
          data: this.incExpStats?.monthIncomeStats.map(item => item.amount) || [], // Datos del eje Y
          backgroundColor: 'rgba(75, 192, 192, 0.2)',  // Verde claro
          borderColor: 'rgba(75, 192, 192, 1)',        // Verde oscuro
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          datalabels: {
            color: '#000',
            formatter: (value: number) => {
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: this.selectedAssetDB1?.symbol }).format(value);
            },
            anchor: 'end',
            align: 'top',
            offset: 4
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: number) => {
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: this.selectedAssetDB1?.symbol }).format(value);
              }
            }
          }
        }
      } as ChartConfiguration['options']
    });


    const ctx4 = document.getElementById('expenseLast6MonthsChart') as HTMLCanvasElement;

    if (!ctx4) return;

    this.db1Graph4?.destroy();
    

    this.db1Graph4 = new Chart(ctx4, {
      type: 'bar',
      data: {
        labels: this.incExpStats?.monthExpenseStats.map(item => {
          const date = new Date(item.month);
          return date.toLocaleString('es-AR', { month: 'long' }).charAt(0).toUpperCase() + date.toLocaleString('es-AR', { month: 'long' }).slice(1);
        }), // Etiquetas del eje X
        datasets: [{
          label: 'Egresos en ' + this.selectedAssetDB1?.symbol,
          data: this.incExpStats?.monthExpenseStats.map(item => item.amount) || [], // Datos del eje Y
          backgroundColor: 'rgba(255, 99, 132, 0.2)',  // Rojo claro
          borderColor: 'rgba(255, 99, 132, 1)',        // Rojo oscuro
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          datalabels: {
            color: '#000',
            formatter: (value: number) => {
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: this.selectedAssetDB1?.symbol }).format(value);
            },
            anchor: 'end',
            align: 'top',
            offset: 4
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: number) => {
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: this.selectedAssetDB1?.symbol }).format(value);
              }
            }
          }
        }
      } as ChartConfiguration['options']
    });

   
    this.viewAux = true;

  }

  loadCardStats() {    
    this.cardTransactionsDTO = [];

    this.isLoadingGraph = true;

    this.reportService.getCardStats(this.selectedCardDB3)
      .subscribe(response => {

        this.isLoadingGraph = false;

        setTimeout(() => {
          this.renderDB3(response);
          this.cardTransactionsDTO = response.cardTransactionsDTO;
        }, 0);
      });
  
  }

  renderDB3(cardStats: CardStats) {
    var currentMonthIndex = 6;

    //graph1
    const ctx1 = document.getElementById('pesosCardsChart') as HTMLCanvasElement;

    if (!ctx1) return;

    this.db3Graph1?.destroy();
    //console.log(cardStats.pesosCardGraphDTO.map(item => item.amount));
    var labelsG1 = cardStats.pesosCardGraphDTO.map(item => {
      const date = new Date(item.month);
      return date.toLocaleString('es-AR', { month: 'long' }).charAt(0).toUpperCase() + date.toLocaleString('es-AR', { month: 'long' }).slice(1);
    });
    
    var dataG1 = cardStats.pesosCardGraphDTO.map(item => item.amount);   

    var backGroundColors = dataG1.map((item, index) => {
      return index < currentMonthIndex ? 'rgba(255, 99, 132, 0.2)' : 'rgba(75, 192, 192, 0.2)'; // rojo para meses anteriores, verde para posteriores
    });
    
    var borderColors = dataG1.map((item, index) => {
      return index < currentMonthIndex ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)'; // rojo para meses anteriores, verde para posteriores
    });    

    this.db3Graph1 = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: labelsG1, // Etiquetas del eje X
        datasets: [{
          label: 'Gastos en Pesos',
          data: dataG1 || [], // Datos del eje Y
          backgroundColor: backGroundColors,  // Verde claro
          borderColor: borderColors,        // Verde oscuro
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            labels: {
              generateLabels: function (chart) {
                  return [
                      {
                          text: '6 Meses Anteriores',
                          fillStyle: 'rgba(255, 99, 132, 0.2)',
                          strokeStyle: 'rgba(255, 99, 132, 1)',
                          lineWidth: 1
                      },
                      {
                          text: '6 Meses Posteriores',
                          fillStyle: 'rgba(75, 192, 192, 0.2)',
                          strokeStyle: 'rgba(75, 192, 192, 1)',
                          lineWidth: 1
                      }
                  ];
              }
          }
          },
          datalabels: {
            display: true,
            color: '#000',
            formatter: (value: number) => {
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
            },
            anchor: 'end',
            align: 'top',
            offset: 4
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: number) => {
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
              }
            }
          }
        }
      } as ChartConfiguration['options']
    });

    //graph 2
    const ctx2 = document.getElementById('dollarCardsChart') as HTMLCanvasElement;

    if (!ctx2) return;

    this.db3Graph2?.destroy();

    //console.log(cardStats);

    var labelsG2 = cardStats.dollarsCardGraphDTO.map(item => {
      const date = new Date(item.month);
      return date.toLocaleString('es-AR', { month: 'long' }).charAt(0).toUpperCase() + date.toLocaleString('es-AR', { month: 'long' }).slice(1);
    });
    
    var dataG2 = cardStats.dollarsCardGraphDTO.map(item => item.amount);   

    backGroundColors = dataG1.map((item, index) => {
      return index < currentMonthIndex ? 'rgba(255, 99, 132, 0.2)' : 'rgba(75, 192, 192, 0.2)'; // rojo para meses anteriores, verde para posteriores
    });

    borderColors = dataG1.map((item, index) => {
      return index < currentMonthIndex ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)'; // rojo para meses anteriores, verde para posteriores
    });

    this.db3Graph2 = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: labelsG2, // Etiquetas del eje X
        datasets: [{
          label: 'Gastos en Dolares',
          data: dataG2 || [], // Datos del eje Y
          backgroundColor: backGroundColors,  // Verde claro
          borderColor: borderColors,        // Verde oscuro
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            labels: {
              generateLabels: function (chart) {
                  return [
                      {
                          text: '6 Meses Anteriores',
                          fillStyle: 'rgba(255, 99, 132, 0.2)',
                          strokeStyle: 'rgba(255, 99, 132, 1)',
                          lineWidth: 1
                      },
                      {
                          text: '6 Meses Posteriores',
                          fillStyle: 'rgba(75, 192, 192, 0.2)',
                          strokeStyle: 'rgba(75, 192, 192, 1)',
                          lineWidth: 1
                      }
                  ];
              }
          }
          },
          datalabels: {
            display: true,
            color: '#000',
            formatter: (value: number) => {
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
            },
            anchor: 'end',
            align: 'top',
            offset: 4
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: number) => {
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
              }
            }
          }
        }
      } as ChartConfiguration['options']
    });
  }


  loadStockStats() {
    this.stocksStatsDTO = [];

    this.viewAux = false;
    this.isLoadingGraph = true;

    this.reportService.getStockStats(this.selectedAssetTypeDB4)
      .subscribe(response => {

        this.isLoadingGraph = false;
        this.viewAux = true;

        setTimeout(() => {
          this.renderDB4(response);
          this.stocksStatsDTO = response.stockStatsInd;
        }, 0);

      });
  }

  renderDB4(data: StockStatsDTO) {
    // graph1
    const ctx1 = document.getElementById('percentajeByTickerChart') as HTMLCanvasElement;

    if (!ctx1) return;

    this.db4Graph1?.destroy();

    var tickers = data.stockStatsInd.map(item => item.assetName);
    var symbols = data.stockStatsInd.map(item => item.symbol);
    var currentValues = data.stockStatsInd.map(item => item.actualValue);

    // generate random colors to avoid contrast issues 
    var controlledColors = this.generateControlledColors(currentValues.length);
   
     // Crear una nueva instancia del gráfico
    this.db4Graph1 = new Chart(ctx1, {
      type: 'pie',
      data: {
        labels: symbols,
        datasets: [{
          data: currentValues,
          backgroundColor: controlledColors,
          hoverOffset: 4
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false,
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                const total = currentValues.reduce((a, b) => a + b, 0);
                const percentage = ((Number(tooltipItem.raw) / total) * 100).toFixed(2);
                const nombreLargo = tickers[tooltipItem.dataIndex];
                const simbolo = symbols[tooltipItem.dataIndex];
                return `${nombreLargo} (${simbolo}): ${new Intl.NumberFormat('en-US', {
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

    // graph2

    const ctx2 = document.getElementById('origVsActualChart') as HTMLCanvasElement;

    if (!ctx2) return;

    this.db4Graph2?.destroy();

    this.db4Graph2 = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: symbols,
        datasets: [{
          label: 'Valores Originales Promedio',
          data: data.stockStatsInd.map(item => item.originalValue),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'Valores Actuales',
          data: currentValues,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
              }
            }
          }
        }
      }
    });

    // graph3

    const ctx3 = document.getElementById('stocksGralChart') as HTMLCanvasElement;

    if (!ctx3) return;

    this.db4Graph3?.destroy();

    var assetTypes = data.stockStatsGral.map(item => item.assetType);
    var currentGralValues = data.stockStatsGral.map(item => item.actualValue);

    // generate random colors to avoid contrast issues
    controlledColors = this.generateControlledColors(currentGralValues.length);

    this.db4Graph3 = new Chart(ctx3, {
      type: 'pie',
      data: {
        labels: assetTypes,
        datasets: [{
          data: currentGralValues,
          backgroundColor: controlledColors,
          hoverOffset: 4
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false,
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                const total = currentGralValues.reduce((a, b) => a + b, 0);
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

  loadCryptoGralStats() {

    this.isLoadingGraph = true;

    this.reportService.getCryptoGralStats(this.includeStables)
      .subscribe(response => {

        this.isLoadingGraph = false;

        setTimeout(() => {
          this.cryptoGralStatsDTO = response.cryptoGralStats;
          this.renderDB5(response);
        }, 0);
      });
  }

  renderDB5(data: CryptoGralStatsDTO) {


     // graph1
     const ctx1 = document.getElementById('cryptosGralDistributionChart') as HTMLCanvasElement;

     if (!ctx1) return;
 
     this.db5Graph1?.destroy();
 
     var tickers = data.cryptoGralStats.map(item => item.assetName);
     var symbols = data.cryptoGralStats.map(item => item.symbol);
     var currentValues = data.cryptoGralStats.map(item => item.actualValue);
 
     // generate random colors to avoid contrast issues 
     var controlledColors = this.generateControlledColors(currentValues.length);
    
      // Crear una nueva instancia del gráfico
     this.db5Graph1 = new Chart(ctx1, {
       type: 'pie',
       data: {
         labels: symbols,
         datasets: [{
           data: currentValues,
           backgroundColor: controlledColors,
           hoverOffset: 4
         }]
       },
       options: {
         plugins: {
           legend: {
             display: false,
             position: 'right'
           },
           tooltip: {
             callbacks: {
               label: (tooltipItem) => {
                 const total = currentValues.reduce((a, b) => a + b, 0);
                 const percentage = ((Number(tooltipItem.raw) / total) * 100).toFixed(2);
                 const nombreLargo = tickers[tooltipItem.dataIndex];
                 const simbolo = symbols[tooltipItem.dataIndex];
                 return `${nombreLargo} (${simbolo}): ${new Intl.NumberFormat('en-US', {
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

    // graph2
    const ctx2 = document.getElementById('walletValueEvolutionChart') as HTMLCanvasElement;   


     if (!ctx2) return;
 
     this.db5Graph2?.destroy();

     // 
      var labels = data.cryptoStatsByDate.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('es-AR');
      });

      var values = data.cryptoStatsByDate.map(item => item.value);

      this.db5Graph2 = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Valor de la Cartera',
            data: values,
            fill: true,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1.5,
            pointRadius: 0
          }]
        },
        options: {
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => {
                  return `${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(Number(tooltipItem.raw))}`;
                }
              }
            },
          },
          scales: {
            x: {
              ticks: {
                callback: function(value, index) {
                  // Muestra solo cada 5 etiquetas
                  return index % 2 === 0 ? this.getLabelForValue(Number(value)) : '';
                }
              }
            },
            y: {
              beginAtZero: false,
              ticks: {
                callback: function(value) {
                  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
                }
              }
            }
          }
        }
      });

      // graph3
    const ctx3 = document.getElementById('buyVolumeEvolutionChart') as HTMLCanvasElement;   


    if (!ctx3) return;

    this.db5Graph3?.destroy();

    const commerceTypeTranslations: Record<string, string> = {
      "BalanceAdj": "Ajuste de Saldos",
      "Trading": "Trading",
      "Fiat/Crypto Commerce": "Comercio Fiat/Crypto"
    }

    const groupedData: Record<string, Record<string, number>> = {};
    const commerceTypes = new Set<string>();

    data.cryptoPurchasesStatsByMonth.forEach((stat) => {
      const month = new Date(stat.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!groupedData[month]) groupedData[month] = {};
      groupedData[month][stat.commerceType] = (groupedData[month][stat.commerceType] || 0) + stat.value;
      commerceTypes.add(stat.commerceType);

    });

    labels = Object.keys(groupedData);
    const commerceTypesArray = Array.from(commerceTypes);
    const colors = this.generateControlledColors(commerceTypesArray.length);

    const datasets = commerceTypesArray.map((type, index) => ({
      label: commerceTypeTranslations[type] || type,
      data: labels.map((month) => groupedData[month][type] || 0),
      backgroundColor: colors[index]
    }));

    this.db5Graph3 = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                return `${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(Number(tooltipItem.raw))}`;
              }
            }
          },
          legend: {
            position: 'top',
          },
        },
        scales: {
          x: {
            stacked: true,
          },
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
              }
            }
          },
        },
      },
    });    
 
  }

  loadCryptos() {
    this.assetService.getAssetsByTypeName('Criptomoneda')
      .subscribe(response => {
        this.cryptos = response;
      });

  }

  loadCryptoStats() {


    
    if (this.selectedCryptoDB6 == 0) {
      this.viewAux = false;
      return
    }
    this.isLoadingGraph = true;

    this.reportService.getCryptoStats(this.selectedCryptoDB6)
      .subscribe(response => {
        this.cryptoTransactionsStatsDTO = response.cryptoTransactionsStats;

        this.viewAux = true;
        this.isLoadingGraph = false;

        setTimeout(() => {
          this.renderDB6(response);

        }, 0);
      });
  }

  renderDB6(data: CryptoStatsDTO) {
    // graph1


    const minValue = data.cryptoRangeValuesStats.minValue.toFixed(2);
    const maxValue = data.cryptoRangeValuesStats.maxValue.toFixed(2);
    const currentValue = data.cryptoRangeValuesStats.currentValue.toFixed(2);
    const averageBuyValue = data.cryptoRangeValuesStats.averageBuyValue.toFixed(2);
    
    var earnLostLine = (Number(averageBuyValue) - Number(minValue)) / ((Number(maxValue) - Number(minValue)));


    const chartDom = document.getElementById('gaugeChart');
    if (!chartDom) {
      console.error('Gauge container not found!');
      return;
    }
  
    // Destruir instancia previa si existe
    const existingChart = echarts.getInstanceByDom(chartDom);
    if (existingChart) {
      existingChart.dispose(); // Destruir la instancia previa
    }

    // Inicializar una nueva instancia de ECharts
    const myChart = echarts.init(chartDom);
    const option = {
      series: [
        {
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          min: minValue,
          max: maxValue,
          splitNumber: 4,
          radius: '110%',
          center: ['50%', '60%'],
          axisLine: {
            lineStyle: {
              width: 15,
              color: [[earnLostLine, '#fd666d'], [1, '#67e0e3']],
            },
          },
          pointer: {
            length: '80%',
            width: 6,
          },
          detail: {
            formatter: '{value}',
            fontSize: 20,
            offsetCenter: [0, '60%'],
            color: '#333',
          },
          data: [{ value: currentValue }],
        },
      ],
    };
    
    myChart.setOption(option);
    
    // Ajustar tamaño automáticamente
    window.addEventListener('resize', () => {
      myChart.resize();
    });

    //graph2

    const ctx2 = document.getElementById('priceEvolutionChart') as HTMLCanvasElement;

    if (!ctx2) return;

    this.db6Graph2?.destroy();

    var labels = data.cryptoEvolutionStats.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('es-AR');
    });

    var values = data.cryptoEvolutionStats.map(item => item.value);

    this.db6Graph2 = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Valor de la Criptomoneda',
          data: values,
          fill: true,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1.5,
          pointRadius: 0
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                return `${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(Number(tooltipItem.raw))}`;
              }
            }
          },
        },
        scales: {
          x: {
            ticks: {
              callback: function(value, index) {
                // Muestra solo cada 5 etiquetas
                return index % 2 === 0 ? this.getLabelForValue(Number(value)) : '';
              }
            }
          },
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
              }
            }
          }
        }
      }
    });

    //graph3

    const ctx3 = document.getElementById('cryptoBalanceChart') as HTMLCanvasElement;

    if (!ctx3) return;

    this.db6Graph3?.destroy();

    var cryptoAccounts = data.cryptoBalanceStats.map(item => item.account);
    var currentValues = data.cryptoBalanceStats.map(item => item.balance);
    var backGroundColors = this.generateControlledColors(currentValues.length);

    // generate pie graph

    this.db6Graph3 = new Chart(ctx3, {
      type: 'pie',
      data: {
        labels: cryptoAccounts,
        datasets: [{
          data: currentValues,
          backgroundColor: backGroundColors,
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                const total = currentValues.reduce((a, b) => a + b, 0);
                const percentage = ((Number(tooltipItem.raw) / total) * 100).toFixed(2);
                const account = cryptoAccounts[tooltipItem.dataIndex];
                return `${account}: ${new Intl.NumberFormat('en-US', {
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

}
