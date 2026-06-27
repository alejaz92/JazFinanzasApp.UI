import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { TransactionClassAddComponent } from './transaction-class-add.component';

describe('TransactionClassAddComponent', () => {
  let component: TransactionClassAddComponent;
  let fixture: ComponentFixture<TransactionClassAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionClassAddComponent],
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(TransactionClassAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
