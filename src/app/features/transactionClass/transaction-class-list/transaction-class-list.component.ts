import { Component, OnInit } from '@angular/core';
import { TransactionClassService} from '../services/transaction-class.service';

@Component({
  selector: 'app-transaction-class-list',
  templateUrl: './transaction-class-list.component.html',
  styleUrls: ['./transaction-class-list.component.css']
})
export class TransactionClassListComponent implements OnInit {
  isLoading: boolean = true;
  incomeClasses: any[] | null = null;
  expenseClasses: any[] | null = null;
  restrictedClasses = ['Ajuste Saldos Ingreso', 'Ajuste Saldos Egreso', 'Gastos Tarjeta',
    'Ingreso Inversiones','Inversiones'];


  constructor(private transactionClassService: TransactionClassService) { }

  ngOnInit(): void {
    this.loadTransactionClasses();  
  }

  loadTransactionClasses(): void {
    this.transactionClassService.getAllTransactionClasses().subscribe((data) => {

      this.incomeClasses = data.filter((x) => x.incExp === 'I');
      this.expenseClasses = data.filter((x) => x.incExp === 'E' );

      this.isLoading = false;
    });
  }

  canEditOrDelete(name: string) : boolean {
    return !this.restrictedClasses.includes(name);
  };

  onDelete(transactionClassId: number): void {
    if(transactionClassId){
      const confirmed = window.confirm('¿Estás seguro de eliminar esta clase de movimiento?');
      if(confirmed) {
        this.transactionClassService.deleteTransactionClass(transactionClassId)
        .subscribe({
          next: (response) => {
            alert('Clase de movimiento eliminada correctamente');
            this.loadTransactionClasses();
          },
          error: (error) => {
            if(error.error == 'Transaction Class is being used in transactions') {
              alert('No se puede eliminar la clase de movimiento porque fue utilizada en transacciones');
            }
          }
        });
      }
    }
  }

}
