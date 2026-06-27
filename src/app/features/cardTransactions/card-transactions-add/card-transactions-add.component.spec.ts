import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { CardTransactionsAddComponent } from './card-transactions-add.component';

describe('CardTransactionsAddComponent', () => {
  let component: CardTransactionsAddComponent;
  let fixture: ComponentFixture<CardTransactionsAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardTransactionsAddComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(CardTransactionsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
