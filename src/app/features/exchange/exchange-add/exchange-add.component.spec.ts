import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ExchangeAddComponent } from './exchange-add.component';
import { provideToastr } from 'ngx-toastr';

describe('ExchangeAddComponent', () => {
  let component: ExchangeAddComponent;
  let fixture: ComponentFixture<ExchangeAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule, ExchangeAddComponent],
    providers: [provideToastr()],
    schemas: [NO_ERRORS_SCHEMA]
});
    fixture = TestBed.createComponent(ExchangeAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
