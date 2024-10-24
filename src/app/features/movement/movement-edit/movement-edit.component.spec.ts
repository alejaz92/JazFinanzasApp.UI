import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovementEditComponent } from './movement-edit.component';

describe('MovementEditComponent', () => {
  let component: MovementEditComponent;
  let fixture: ComponentFixture<MovementEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MovementEditComponent]
    });
    fixture = TestBed.createComponent(MovementEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
