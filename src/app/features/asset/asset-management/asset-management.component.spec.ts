import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { AssetManagementComponent } from './asset-management.component';

describe('AssetManagementComponent', () => {
  let component: AssetManagementComponent;
  let fixture: ComponentFixture<AssetManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AssetManagementComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(AssetManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
