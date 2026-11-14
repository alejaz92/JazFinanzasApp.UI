import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';

// plan-inicio-rapido.md, Fase 7 (D10): el servidor de la API se "duerme" si nadie lo usa un rato y el primer pedido tarda 12 a 19 segundos
// solo en despertarlo. Apenas se abre la app (antes de que el usuario termine de escribir la contraseña) se le hace un pedido liviano a
// `GET api/Health`, que además toca la base y deja lista la conexión, para que cuando llegue el login ya esté despierto.
//
// Es "dispará y olvidá": no se espera la respuesta, no se muestra nada y un fallo (servidor caído, sin red) se ignora — si el servidor no
// responde, el login y las pantallas ya muestran su propio error. Una sola vez por apertura de la app.
@Injectable({
  providedIn: 'root'
})
export class ServerWarmupService {
  private started = false;

  constructor(private http: HttpClient) { }

  warmUp(): void {
    if (this.started) return;
    this.started = true;

    this.http.get(`${environment.apiBaseURL}/api/health`).subscribe({
      error: () => { /* a propósito: el despertar no es crítico */ }
    });
  }
}
