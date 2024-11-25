import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TransactionClass } from '../models/transactionClass.model';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionClassService } from '../services/transaction-class.service';

@Component({
  selector: 'app-transaction-class-edit',
  templateUrl: './transaction-class-edit.component.html',
  styleUrls: ['./transaction-class-edit.component.css']
})
export class TransactionClassEditComponent implements OnInit, OnDestroy{
  id: string | null = null;
  paramsSubcription?: Subscription;
  editTransactionClassSubscription?: Subscription;
  transactionClass?: TransactionClass;

  constructor(private route: ActivatedRoute, private transactionClassService: TransactionClassService, private router: Router) {  }

  ngOnInit(): void {
    this.paramsSubcription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');

        if (this.id) {
          // Get data from server
          this.transactionClassService.getTransactionClassById(Number(this.id)).subscribe({
            next: (response) => {
              this.transactionClass = response;
            }
          });
        } 
      }
    });
  }

  onFormSubmit(): void {
    const transactionClassUpdateRequest: TransactionClass = {
      incExp: this.transactionClass?.incExp ?? '',
      id: this.transactionClass?.id ?? 0,
      description: this.transactionClass?.description ?? ''
    };

    if (this.id) {
      this.editTransactionClassSubscription = this.transactionClassService.updateTransactionClass(Number(this.id), transactionClassUpdateRequest).subscribe({
        next: (response) => {
          this.router.navigateByUrl('/management/transactionClass');
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.paramsSubcription?.unsubscribe();
    this.editTransactionClassSubscription?.unsubscribe();
  }

}
