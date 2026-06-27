import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxPaginationModule } from 'ngx-pagination';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { CurrencyExchangeListComponent } from './currency-exchange-list.component';

describe('CurrencyExchangeListComponent', () => {
  let component: CurrencyExchangeListComponent;
  let fixture: ComponentFixture<CurrencyExchangeListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CurrencyExchangeListComponent],
      imports: [HttpClientTestingModule, RouterTestingModule, NgxPaginationModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(CurrencyExchangeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
