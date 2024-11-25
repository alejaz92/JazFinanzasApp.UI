import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionRefundComponent } from './transaction-refund.component';

describe('TransactionRefundComponent', () => {
  let component: TransactionRefundComponent;
  let fixture: ComponentFixture<TransactionRefundComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionRefundComponent]
    });
    fixture = TestBed.createComponent(TransactionRefundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
