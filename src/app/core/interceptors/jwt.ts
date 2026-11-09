import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, catchError, throwError } from "rxjs";
import { AuthService } from "src/app/features/auth/services/auth.service";

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.authService.getToken();

        if (token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        return next.handle(request).pipe(
            catchError((error: unknown) => {
                // Si el backend rechaza el token (se rotó la clave de sesiones, venció, etc.) se cierra la sesión y se
                // va al login, en vez de dejar todas las pantallas fallando. El login mismo queda afuera: un usuario o
                // una contraseña incorrectos también dan 401 y no es una sesión caída (plan-secretos-expuestos.md, D8).
                if (error instanceof HttpErrorResponse && error.status === 401 && token && !request.url.endsWith('/api/auth/login')) {
                    this.authService.logout();
                }
                return throwError(() => error);
            })
        );
    }
}
