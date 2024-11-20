import { TestBed } from '@angular/core/testing';

import { StockTranctionsService } from './stock-tranctions.service';

describe('StockTranctionsService', () => {
  let service: StockTranctionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockTranctionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
