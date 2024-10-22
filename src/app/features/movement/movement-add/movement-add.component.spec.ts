import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovementAddComponent } from './movement-add.component';

describe('MovementAddComponent', () => {
  let component: MovementAddComponent;
  let fixture: ComponentFixture<MovementAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MovementAddComponent]
    });
    fixture = TestBed.createComponent(MovementAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
