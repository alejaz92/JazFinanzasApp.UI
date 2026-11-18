import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CardTransactionsService } from './card-transactions.service';

describe('CardTransactionsService', () => {
  let service: CardTransactionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CardTransactionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // plan-repartos-y-descuentos-faltantes.md, Fase 8
  it('should ask for the purchases that do not close', () => {
    const http = TestBed.inject(HttpTestingController);
    let result: any;

    service.getPurchaseMismatches().subscribe(r => result = r);

    const request = http.expectOne(r => r.url.endsWith('/api/CardTransaction/mismatches'));
    expect(request.request.method).toBe('GET');
    request.flush([{ cardTransactionId: 7 }]);
    expect(result).toEqual([{ cardTransactionId: 7 }] as any);
    http.verify();
  });

  it('should post the explanation of the difference of a purchase', () => {
    const http = TestBed.inject(HttpTestingController);

    service.explainPurchaseDifference(7, { kind: 'People', people: [{ personId: 1, amount: 100 }] }).subscribe();

    const request = http.expectOne(r => r.url.endsWith('/api/CardTransaction/7/difference'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ kind: 'People', people: [{ personId: 1, amount: 100 }] });
    request.flush(null);
    http.verify();
  });
});
