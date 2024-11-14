import { TestBed } from '@angular/core/testing';

import { CryptoMovementService } from './crypto-movement.service';

describe('CryptoMovementService', () => {
  let service: CryptoMovementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CryptoMovementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
