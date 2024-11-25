import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionClassEditComponent } from './transaction-class-edit.component';

describe('TransactionClassEditComponent', () => {
  let component: TransactionClassEditComponent;
  let fixture: ComponentFixture<TransactionClassEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionClassEditComponent]
    });
    fixture = TestBed.createComponent(TransactionClassEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
