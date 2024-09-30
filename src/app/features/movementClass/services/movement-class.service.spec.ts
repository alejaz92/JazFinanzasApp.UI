import { TestBed } from '@angular/core/testing';

import { MovementClassService } from './movement-class.service';

describe('MovementClassService', () => {
  let service: MovementClassService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovementClassService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
