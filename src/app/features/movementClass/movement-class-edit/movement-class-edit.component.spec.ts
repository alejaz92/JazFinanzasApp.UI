import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovementClassEditComponent } from './movement-class-edit.component';

describe('MovementClassEditComponent', () => {
  let component: MovementClassEditComponent;
  let fixture: ComponentFixture<MovementClassEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MovementClassEditComponent]
    });
    fixture = TestBed.createComponent(MovementClassEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
