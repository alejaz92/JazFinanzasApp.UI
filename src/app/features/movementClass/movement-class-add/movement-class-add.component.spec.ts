import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovementClassAddComponent } from './movement-class-add.component';

describe('MovementClassAddComponent', () => {
  let component: MovementClassAddComponent;
  let fixture: ComponentFixture<MovementClassAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MovementClassAddComponent]
    });
    fixture = TestBed.createComponent(MovementClassAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
