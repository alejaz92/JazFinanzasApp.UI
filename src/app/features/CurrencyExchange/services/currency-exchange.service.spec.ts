import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { CurrencyExchangeService } from './currency-exchange.service';

describe('CurrencyExchangeService', () => {
  let service: CurrencyExchangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CurrencyExchangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
