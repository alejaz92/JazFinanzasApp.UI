import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockTransactionAddComponent } from './stock-transaction-add.component';

describe('StockTransactionAddComponent', () => {
  let component: StockTransactionAddComponent;
  let fixture: ComponentFixture<StockTransactionAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StockTransactionAddComponent]
    });
    fixture = TestBed.createComponent(StockTransactionAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
