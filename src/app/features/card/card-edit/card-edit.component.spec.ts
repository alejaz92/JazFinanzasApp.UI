import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { CardEditComponent } from './card-edit.component';
import { provideToastr } from 'ngx-toastr';

describe('CardEditComponent', () => {
  let component: CardEditComponent;
  let fixture: ComponentFixture<CardEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule, CardEditComponent],
    providers: [provideToastr()],
    schemas: [NO_ERRORS_SCHEMA]
});
    fixture = TestBed.createComponent(CardEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
