import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { TransactionEditComponent } from './transaction-edit.component';

describe('TransactionEditComponent', () => {
  let component: TransactionEditComponent;
  let fixture: ComponentFixture<TransactionEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionEditComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(TransactionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
