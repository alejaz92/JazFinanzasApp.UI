import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionClassAddComponent } from './transaction-class-add.component';

describe('TransactionClassAddComponent', () => {
  let component: TransactionClassAddComponent;
  let fixture: ComponentFixture<TransactionClassAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionClassAddComponent]
    });
    fixture = TestBed.createComponent(TransactionClassAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
