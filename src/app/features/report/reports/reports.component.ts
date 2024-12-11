import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ReportService } from '../services/report.service';
import { IncExpStats } from '../models/IncExpStats.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js/auto';
import { CardService } from '../../card/services/card.service';
import { Card } from '../../card/models/card.model';
import { CardStats } from '../models/CardStats.model';
import { CardTransactionPaymentList } from '../../cardTransactions/models/CardTransactionPayment-List.model';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  selectedMonthDB1: String = '';
  selectedMonthDB2: String = '';
  selectedCardDB3: number = 0;
  cardTransactionsDTO: CardTransactionPaymentList[] = [];
  cards: Card[] = [];
  incExpDollarStats: IncExpStats | null = null;
  incExpPesosStats: IncExpStats | null = null;
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


  constructor(
    private reportService: ReportService,
    private cardService: CardService
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
    
  }

  loadCards() {
    this.cardService.getAllCards().subscribe(response => {
      this.cards = response;
      this.loadCardStats();
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



}
