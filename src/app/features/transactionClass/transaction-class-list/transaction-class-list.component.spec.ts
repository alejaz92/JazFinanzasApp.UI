import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionClassListComponent } from './transaction-class-list.component';

describe('TransactionClassListComponent', () => {
  let component: TransactionClassListComponent;
  let fixture: ComponentFixture<TransactionClassListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionClassListComponent]
    });
    fixture = TestBed.createComponent(TransactionClassListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
