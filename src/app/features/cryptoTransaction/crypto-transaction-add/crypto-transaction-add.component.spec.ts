import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { CryptoTransactionAddComponent } from './crypto-transaction-add.component';

describe('CryptoTransactionAddComponent', () => {
  let component: CryptoTransactionAddComponent;
  let fixture: ComponentFixture<CryptoTransactionAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CryptoTransactionAddComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(CryptoTransactionAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
