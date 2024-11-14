import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CryptoMovementAddComponent } from './crypto-movement-add.component';

describe('CryptoMovementAddComponent', () => {
  let component: CryptoMovementAddComponent;
  let fixture: ComponentFixture<CryptoMovementAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CryptoMovementAddComponent]
    });
    fixture = TestBed.createComponent(CryptoMovementAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
