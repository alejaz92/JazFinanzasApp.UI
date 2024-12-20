import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ReportService } from '../services/report.service';
import { IncExpStats } from '../models/IncExpStats.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js/auto';
import { CardService } from '../../card/services/card.service';
import { Card } from '../../card/models/card.model';
import { CardStats } from '../models/CardStats.model';
import { CardTransactionPaymentList } from '../../cardTransactions/models/CardTransactionPayment-List.model';
import { AssetType } from '../../account/models/assetType.model';
import { AssetTypeService } from '../../assetType/services/asset-type.service';
import { StockStatsDTO, StockStatsListDTO } from '../models/StockStats.model';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { CryptoGralStatsDTO } from '../models/CryptoGralStats.model';


@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  selectedMonthDB1: String = '';
  selectedMonthDB2: String = '';
  selectedCardDB3: number = 0;
  selectedAssetTypeDB4: number = 0;
  includeStables: boolean = false;
  cardTransactionsDTO: CardTransactionPaymentList[] = [];
  cards: Card[] = [];
  assetTypes: AssetType[] = [];
  incExpDollarStats: IncExpStats | null = null;
  incExpPesosStats: IncExpStats | null = null;
  stocksStatsDTO: StockStatsListDTO[] = [];
  cryptoGralStatsDTO: StockStatsListDTO[] = [];
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


  constructor(
    private reportService: ReportService,
    private cardService: CardService,
    private assetTypeService: AssetTypeService
  ) {}

  ngOnInit(): void {

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    this.selectedMonthDB1 = `${year}-${month}`;
    this.selectedMonthDB2 = `${year}-${month}`;


    this.loadIncExpDollarStats();
    this.loadIncExpPesosStats();
    this.loadCards();
    this.loadAssetTypes();
    this.loadCryptoGralStats();

    
  }

  loadCards() {
    this.cardService.getAllCards().subscribe(response => {
      this.cards = response;
      this.loadCardStats();
    });
  }

  loadAssetTypes() {
    this.assetTypeService.getAssetTypes('BOLSA').subscribe(response => {
      this.assetTypes = response;
    });
  }

  loadIncExpDollarStats() {

    //transform this.selectedMonthDB1 to Date

    if (this.selectedMonthDB1 != null) {
      this.reportService.getIncExpDollarsStats(this.selectedMonthDB1)
        .subscribe(response => {
          
          this.incExpDollarStats = response;

          this.renderDB1();
        });
    }
  }

  renderDB1() {
    //graph1
    const ctx1 = document.getElementById('incomeByClassDollarChart') as HTMLCanvasElement;

    if (!ctx1) return;

    this.db1Graph1?.destroy();

    this.db1Graph1 = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: this.incExpDollarStats?.classIncomeStats.map(item => item.transactionClass), // Etiquetas del eje X
        datasets: [{
          label: 'Ingresos en USD',
          data: this.incExpDollarStats?.classIncomeStats.map(item => item.amount) || [], // Datos del eje Y
          backgroundColor: 'rgba(75, 192, 192, 0.2)',  // Verde claro
          borderColor: 'rgba(75, 192, 192, 1)',        // Verde oscuro
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Ingresos por Clase',
            font: {
              size: 18
            },
            padding: {
              bottom: 10
            }
          },
          legend: {
            display: false
          },
          datalabels: {
            color: '#000',
            formatter: (value: number) => {
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(value);
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
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(value);
              }
            }
          }
        }
      } as ChartConfiguration['options']
    });


    const ctx2 = document.getElementById('expenseByClassDollarChart') as HTMLCanvasElement;

    if (!ctx2) return;

    this.db1Graph2?.destroy();
    

    this.db1Graph2 = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: this.incExpDollarStats?.classExpenseStats.map(item => item.transactionClass), // Etiquetas del eje X
        datasets: [{
          label: 'Egresos en USD',
          data: this.incExpDollarStats?.classExpenseStats.map(item => item.amount) || [], // Datos del eje Y
          backgroundColor: 'rgba(255, 99, 132, 0.2)',  // Rojo claro
          borderColor: 'rgba(255, 99, 132, 1)',        // Rojo oscuro
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Egresos por Clase',
            font: {
              size: 18
            },
            padding: {
              bottom: 10
            }
          },
          legend: {
            display: false
          },
          datalabels: {
            color: '#000',
            formatter: (value: number) => {
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(value);
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
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(value);
              }
            }
          }
        }
      } as ChartConfiguration['options']
    });


    const ctx3 = document.getElementById('incomeLast6MonthsDollarChart') as HTMLCanvasElement;

    if (!ctx3) return;

    this.db1Graph3?.destroy();
    

    this.db1Graph3 = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: this.incExpDollarStats?.monthIncomeStats.map(item => {
          const date = new Date(item.month);
          return date.toLocaleString('es-AR', { month: 'long' }).charAt(0).toUpperCase() + date.toLocaleString('es-AR', { month: 'long' }).slice(1);
        }), // Etiquetas del eje X
        datasets: [{
          label: 'Ingresos en USD',
          data: this.incExpDollarStats?.monthIncomeStats.map(item => item.amount) || [], // Datos del eje Y
          backgroundColor: 'rgba(75, 192, 192, 0.2)',  // Verde claro
          borderColor: 'rgba(75, 192, 192, 1)',        // Verde oscuro
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Ingresos por Mes',
            font: {
              size: 18
            },
            padding: {
              bottom: 10
            }
          },
          legend: {
            display: false
          },
          datalabels: {
            color: '#000',
            formatter: (value: number) => {
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(value);
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
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(value);
              }
            }
          }
        }
      } as ChartConfiguration['options']
    });


    const ctx4 = document.getElementById('expenseLast6MonthsDollarChart') as HTMLCanvasElement;

    if (!ctx4) return;

    this.db1Graph4?.destroy();
    

    this.db1Graph4 = new Chart(ctx4, {
      type: 'bar',
      data: {
        labels: this.incExpDollarStats?.monthExpenseStats.map(item => {
          const date = new Date(item.month);
          return date.toLocaleString('es-AR', { month: 'long' }).charAt(0).toUpperCase() + date.toLocaleString('es-AR', { month: 'long' }).slice(1);
        }), // Etiquetas del eje X
        datasets: [{
          label: 'Egresos en USD',
          data: this.incExpDollarStats?.monthExpenseStats.map(item => item.amount) || [], // Datos del eje Y
          backgroundColor: 'rgba(255, 99, 132, 0.2)',  // Rojo claro
          borderColor: 'rgba(255, 99, 132, 1)',        // Rojo oscuro
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Egresos por Mes',
            font: {
              size: 18
            },
            padding: {
              bottom: 10
            }
          },
          legend: {
            display: false
          },
          datalabels: {
            color: '#000',
            formatter: (value: number) => {
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(value);
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
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(value);
              }
            }
          }
        }
      } as ChartConfiguration['options']
    });
  }

  loadIncExpPesosStats() {

    //transform this.selectedMonthDB2 to Date

    if (this.selectedMonthDB2 != null) {
      this.reportService.getIncExpPesosStats(this.selectedMonthDB2)
        .subscribe(response => {
          
          this.incExpPesosStats = response;

          this.renderDB2();
        });
    }
  }

  renderDB2() {
       //graph1
       const ctx1 = document.getElementById('incomeByClassPesosChart') as HTMLCanvasElement;

       if (!ctx1) return;
   
       this.db2Graph1?.destroy();
   
       this.db2Graph1 = new Chart(ctx1, {
         type: 'bar',
         data: {
           labels: this.incExpPesosStats?.classIncomeStats.map(item => item.transactionClass), // Etiquetas del eje X
           datasets: [{
             label: 'Ingresos en ARS',
             data: this.incExpPesosStats?.classIncomeStats.map(item => item.amount) || [], // Datos del eje Y
             backgroundColor: 'rgba(75, 192, 192, 0.2)',  // Verde claro
             borderColor: 'rgba(75, 192, 192, 1)',        // Verde oscuro
             borderWidth: 1
           }]
         },
         options: {
           responsive: true,
           plugins: {
             title: {
               display: true,
               text: 'Ingresos por Clase',
               font: {
                 size: 18
               },
               padding: {
                 bottom: 10
               }
             },
             legend: {
               display: false
             },
             datalabels: {
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
   
   
       const ctx2 = document.getElementById('expenseByClassPesosChart') as HTMLCanvasElement;
   
       if (!ctx2) return;
   
       this.db2Graph2?.destroy();
       
   
       this.db2Graph2 = new Chart(ctx2, {
         type: 'bar',
         data: {
           labels: this.incExpPesosStats?.classExpenseStats.map(item => item.transactionClass), // Etiquetas del eje X
           datasets: [{
             label: 'Egresos en ARS',
             data: this.incExpPesosStats?.classExpenseStats.map(item => item.amount) || [], // Datos del eje Y
             backgroundColor: 'rgba(255, 99, 132, 0.2)',  // Rojo claro
             borderColor: 'rgba(255, 99, 132, 1)',        // Rojo oscuro
             borderWidth: 1
           }]
         },
         options: {
           responsive: true,
           plugins: {
             title: {
               display: true,
               text: 'Egresos por Clase',
               font: {
                 size: 18
               },
               padding: {
                 bottom: 10
               }
             },
             legend: {
               display: false
             },
             datalabels: {
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
   
   
       const ctx3 = document.getElementById('incomeLast6MonthsPesosChart') as HTMLCanvasElement;
   
       if (!ctx3) return;
   
       this.db2Graph3?.destroy();
       
   
       this.db2Graph3 = new Chart(ctx3, {
         type: 'bar',
         data: {
           labels: this.incExpPesosStats?.monthIncomeStats.map(item => {
             const date = new Date(item.month);
             return date.toLocaleString('es-AR', { month: 'long' }).charAt(0).toUpperCase() + date.toLocaleString('es-AR', { month: 'long' }).slice(1);
           }), // Etiquetas del eje X
           datasets: [{
             label: 'Ingresos en ARS',
             data: this.incExpPesosStats?.monthIncomeStats.map(item => item.amount) || [], // Datos del eje Y
             backgroundColor: 'rgba(75, 192, 192, 0.2)',  // Verde claro
             borderColor: 'rgba(75, 192, 192, 1)',        // Verde oscuro
             borderWidth: 1
           }]
         },
         options: {
           responsive: true,
           plugins: {
             title: {
               display: true,
               text: 'Ingresos por Mes',
               font: {
                 size: 18
               },
               padding: {
                 bottom: 10
               }
             },
             legend: {
               display: false
             },
             datalabels: {
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
   
   
       const ctx4 = document.getElementById('expenseLast6MonthsPesosChart') as HTMLCanvasElement;
   
       if (!ctx4) return;
   
       this.db2Graph4?.destroy();
       
   
       this.db2Graph4 = new Chart(ctx4, {
         type: 'bar',
         data: {
           labels: this.incExpPesosStats?.monthExpenseStats.map(item => {
             const date = new Date(item.month);
             return date.toLocaleString('es-AR', { month: 'long' }).charAt(0).toUpperCase() + date.toLocaleString('es-AR', { month: 'long' }).slice(1);
           }), // Etiquetas del eje X
           datasets: [{
             label: 'Egresos en ARS',
             data: this.incExpPesosStats?.monthExpenseStats.map(item => item.amount) || [], // Datos del eje Y
             backgroundColor: 'rgba(255, 99, 132, 0.2)',  // Rojo claro
             borderColor: 'rgba(255, 99, 132, 1)',        // Rojo oscuro
             borderWidth: 1
           }]
         },
         options: {
           responsive: true,
           plugins: {
             title: {
               display: true,
               text: 'Egresos por Mes',
               font: {
                 size: 18
               },
               padding: {
                 bottom: 10
               }
             },
             legend: {
               display: false
             },
             datalabels: {
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

  loadCardStats() {    
    this.cardTransactionsDTO = [];

    this.reportService.getCardStats(this.selectedCardDB3)
      .subscribe(response => {
        this.renderDB3(response);
        this.cardTransactionsDTO = response.cardTransactionsDTO;
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
          title: {
            display: true,
            text: 'Gastos en Pesos',
            font: {
              size: 18
            },
            padding: {
              bottom: 10
            }
          },
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
          title: {
            display: true,
            text: 'Gastos en Dolares',
            font: {
              size: 18
            },
            padding: {
              bottom: 10
            }
          },
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

    this.reportService.getStockStats(this.selectedAssetTypeDB4)
      .subscribe(response => {
        this.renderDB4(response);

        this.stocksStatsDTO = response.stockStatsInd;
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
          title: {
            display: true,
            text: 'Distribución por Ticker (En Dólares)'
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
          title: {
            display: true,
            text: 'Valores Originales Prom. vs Actuales (En Dólares)'
          }
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
          title: {
            display: true,
            text: 'Distribución por Tipo de Activo (En Dólares)'
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

  loadCryptoGralStats() {
    this.reportService.getCryptoGralStats(this.includeStables)
      .subscribe(response => {
        this.cryptoGralStatsDTO = response.cryptoGralStats;
        this.renderDB5(response);
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
           title: {
             display: true,
             text: 'Distribución por Crypto (En Dólares)'
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
            title: {
              display: true,
              text: 'Evolución del Valor de la Cartera (En Dólares)'
            },
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
          title: {
            display: true,
            text: 'Volumen Mensual de Ingresos (En Dólares)'
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


}
