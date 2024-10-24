import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovementRefundComponent } from './movement-refund.component';

describe('MovementRefundComponent', () => {
  let component: MovementRefundComponent;
  let fixture: ComponentFixture<MovementRefundComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MovementRefundComponent]
    });
    fixture = TestBed.createComponent(MovementRefundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
