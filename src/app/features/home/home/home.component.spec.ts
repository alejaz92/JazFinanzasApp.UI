import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideToastr } from 'ngx-toastr';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule, HomeComponent],
    // Inicio inyecta ToastService (ngx-toastr): sin este proveedor el componente no se puede crear.
    providers: [provideToastr()],
    schemas: [NO_ERRORS_SCHEMA]
});
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
