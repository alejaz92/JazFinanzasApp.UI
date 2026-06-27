import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { TransactionClassEditComponent } from './transaction-class-edit.component';

describe('TransactionClassEditComponent', () => {
  let component: TransactionClassEditComponent;
  let fixture: ComponentFixture<TransactionClassEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionClassEditComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(TransactionClassEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
