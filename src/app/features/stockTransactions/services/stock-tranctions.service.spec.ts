import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { StockTranctionsService } from './stock-tranctions.service';

describe('StockTranctionsService', () => {
  let service: StockTranctionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(StockTranctionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
