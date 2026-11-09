import { HttpClient, provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { JwtInterceptor } from './jwt';

// plan-secretos-expuestos.md, D8 — un 401 con sesión abierta cierra la sesión; el 401 del login no.
describe('JwtInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'logout']);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('agrega el token a la petición', () => {
    auth.getToken.and.returnValue('abc');
    http.get('/api/algo').subscribe();
    const req = controller.expectOne('/api/algo');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({});
  });

  it('cierra la sesión ante un 401 con token', () => {
    auth.getToken.and.returnValue('abc');
    let status = 0;
    http.get('/api/algo').subscribe({ error: e => status = e.status });
    controller.expectOne('/api/algo').flush('', { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });

  it('no cierra la sesión por el 401 del login (credenciales incorrectas)', () => {
    auth.getToken.and.returnValue(null);
    http.post('/api/auth/login', {}).subscribe({ error: () => { } });
    controller.expectOne('/api/auth/login').flush('', { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('no cierra la sesión ante un 401 sin token', () => {
    auth.getToken.and.returnValue(null);
    http.get('/api/algo').subscribe({ error: () => { } });
    controller.expectOne('/api/algo').flush('', { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('no cierra la sesión ante otros errores (403, 500)', () => {
    auth.getToken.and.returnValue('abc');
    http.get('/api/a').subscribe({ error: () => { } });
    http.get('/api/b').subscribe({ error: () => { } });
    controller.expectOne('/api/a').flush('', { status: 403, statusText: 'Forbidden' });
    controller.expectOne('/api/b').flush('', { status: 500, statusText: 'Error' });
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
