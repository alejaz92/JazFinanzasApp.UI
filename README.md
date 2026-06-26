# JazFinanzasApp.Frontend

SPA Angular de JazFinanzasApp — finanzas personales e inversiones. Permite registrar ingresos y gastos, gestionar tarjetas de crédito, hacer seguimiento de inversiones en acciones y criptomonedas, administrar portfolios, gastos compartidos y consultar reportes y balances.

---

## Características

- **Autenticación** — Login con JWT, cambio de contraseña y recuperación.
- **Cuentas** — Alta, edición y eliminación de cuentas bancarias/billeteras, con tipos de activos asociados.
- **Tarjetas** — Gestión de tarjetas de crédito y sus cuotas/pagos recurrentes.
- **Transacciones** — Registro de ingresos y egresos con categorías personalizables, devoluciones y edición.
- **Inversiones** — Acciones, criptomonedas y portfolios, con seguimiento de posición y precio promedio.
- **Cambio de moneda** — Operaciones de compra/venta de divisas fiat y transferencias entre portfolios.
- **Gastos compartidos** — Registro y reembolso de gastos compartidos entre personas (feature en desarrollo).
- **Reportes y balance** — Dashboard con gráficos de distribución (Chart.js / ECharts), últimas transacciones, cuotas pendientes y resumen financiero global.
- **PWA** — Instalable como Progressive Web App con soporte offline básico.

Arquitectura del frontend (NgModules, estructura de `src/app/`, pipes compartidos) documentada en [CLAUDE.md](./CLAUDE.md).

---

## Stack tecnológico

| Tecnología | Versión |
|---|---|
| Angular | 16.2 |
| TypeScript | 5.1 |
| Chart.js | 4.4 |
| ECharts (ngx-echarts) | 5.6 |
| Angular Service Worker (PWA) | 16.2 |
| ngx-pagination | 6.0 |
| ngx-spinner | 17.0 |

---

## Requisitos previos

- [Node.js 18+](https://nodejs.org/) y npm
- [Angular CLI 16](https://angular.io/cli): `npm install -g @angular/cli@16`

---

## Configuración y ejecución

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar la URL del backend** en `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'https://localhost:7203/api'
   };
   ```

3. **Ejecutar el servidor de desarrollo:**
   ```bash
   ng serve
   ```
   La app estará disponible en `http://localhost:4200`.

---

## Tests

```bash
ng test
```

---

## Despliegue

El proyecto incluye `swa-cli.config.json` para Azure Static Web Apps:

```bash
ng build
swa deploy ./dist/jaz-finanzas-app.ui --env production
```

O bien conectar el repositorio directamente a un recurso de Azure Static Web Apps para CI/CD automático desde la rama principal (ver `.github/workflows/`).
