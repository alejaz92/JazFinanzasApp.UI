import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxPaginationModule } from 'ngx-pagination';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ExchangeListComponent } from './exchange-list.component';

describe('ExchangeListComponent', () => {
  let component: ExchangeListComponent;
  let fixture: ComponentFixture<ExchangeListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExchangeListComponent],
      imports: [HttpClientTestingModule, RouterTestingModule, NgxPaginationModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(ExchangeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
