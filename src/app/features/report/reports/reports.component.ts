import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ReportService } from '../services/report.service';
import { IncExpStats } from '../models/IncExpStats.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js/auto';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  selectedMonthDB1: String = '';
  selectedMonthDB2: String = '';
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


  constructor(
    private reportService: ReportService
  ) {}

  ngOnInit(): void {

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    this.selectedMonthDB1 = `${year}-${month}`;
    this.selectedMonthDB2 = `${year}-${month}`;


    this.loadIncExpDollarStats();
    this.loadIncExpPesosStats();
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
  

}
