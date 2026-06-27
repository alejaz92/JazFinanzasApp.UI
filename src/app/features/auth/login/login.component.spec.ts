import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(() => {
    // ngAfterViewInit usa el global `bootstrap` (Bootstrap JS cargado vía CDN en
    // index.html en la app real); en el entorno de test no está disponible.
    (window as any).bootstrap = { Tooltip: class {} };

    TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule, LoginComponent],
    schemas: [NO_ERRORS_SCHEMA]
});
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
