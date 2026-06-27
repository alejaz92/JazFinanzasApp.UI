import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { TransactionClassListComponent } from './transaction-class-list.component';

describe('TransactionClassListComponent', () => {
  let component: TransactionClassListComponent;
  let fixture: ComponentFixture<TransactionClassListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionClassListComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(TransactionClassListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
