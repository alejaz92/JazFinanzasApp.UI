import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CryptoMovementListComponent } from './crypto-movement-list.component';

describe('CryptoMovementListComponent', () => {
  let component: CryptoMovementListComponent;
  let fixture: ComponentFixture<CryptoMovementListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CryptoMovementListComponent]
    });
    fixture = TestBed.createComponent(CryptoMovementListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
