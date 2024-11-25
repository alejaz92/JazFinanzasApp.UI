import { Component, OnDestroy } from '@angular/core';
import { TransactionClassAddRequest } from '../models/transactionClass-addRequest.model';
import { Subscription } from 'rxjs';
import { TransactionClassService } from '../services/transaction-class.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transaction-class-add',
  templateUrl: './transaction-class-add.component.html',
  styleUrls: ['./transaction-class-add.component.css']
})
export class TransactionClassAddComponent implements OnDestroy{
  model: TransactionClassAddRequest;
  private addTransactionClassSubscription?: Subscription;

  constructor(private transactionClassService: TransactionClassService, private router: Router) {
    this.model = {
      description: '',
      incExp: ''
    };
  }

  onFormSubmit() {
    this.addTransactionClassSubscription = this.transactionClassService.addTransactionClass(this.model)
      .subscribe({
        next: (response) => {
          this.router.navigate(['/management/transactionClass']);
        }
      })
  }

  ngOnDestroy(): void {
    this.addTransactionClassSubscription?.unsubscribe();
  }
}
