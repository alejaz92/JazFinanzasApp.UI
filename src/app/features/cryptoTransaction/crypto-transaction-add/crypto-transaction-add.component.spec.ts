import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CryptoTransactionAddComponent } from './crypto-transaction-add.component';

describe('CryptoTransactionAddComponent', () => {
  let component: CryptoTransactionAddComponent;
  let fixture: ComponentFixture<CryptoTransactionAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CryptoTransactionAddComponent]
    });
    fixture = TestBed.createComponent(CryptoTransactionAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
