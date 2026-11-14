import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ServerWarmupService } from './server-warmup.service';

// plan-inicio-rapido.md, Fase 7: el pedido que despierta al servidor.
describe('ServerWarmupService', () => {
  let service: ServerWarmupService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ServerWarmupService);
    http = TestBed.inject(HttpTestingController);
  });

  it('hace un GET a api/health', () => {
    service.warmUp();

    const req = http.expectOne(r => r.url.toLowerCase().endsWith('/api/health'));
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('lo hace una sola vez por apertura, aunque se llame de nuevo', () => {
    service.warmUp();
    service.warmUp();
    service.warmUp();

    expect(http.match(r => r.url.toLowerCase().endsWith('/api/health')).length).toBe(1);
  });

  it('un fallo del servidor no propaga ningún error', () => {
    service.warmUp();

    const req = http.expectOne(r => r.url.toLowerCase().endsWith('/api/health'));
    expect(() => req.flush('caído', { status: 503, statusText: 'Service Unavailable' })).not.toThrow();
  });

  it('un error de red tampoco propaga ningún error', () => {
    service.warmUp();

    const req = http.expectOne(r => r.url.toLowerCase().endsWith('/api/health'));
    expect(() => req.error(new ProgressEvent('error'))).not.toThrow();
  });
});
