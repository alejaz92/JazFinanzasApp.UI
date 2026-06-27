import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { StockTransactionAddComponent } from './stock-transaction-add.component';

describe('StockTransactionAddComponent', () => {
  let component: StockTransactionAddComponent;
  let fixture: ComponentFixture<StockTransactionAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StockTransactionAddComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(StockTransactionAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
