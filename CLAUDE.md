# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos principales

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:4200)
npm start

# Build de producción
npm run build

# Tests (Karma + Jasmine, abre Chrome)
npm test

# Build en modo watch
npm run watch
```

## Arquitectura — Angular 19, NgModules

Migrado de Angular 16 a 19 (ver `docs/plans/migracion-angular.md`). A diferencia de proyectos Angular más nuevos creados desde cero, esta app usa **NgModules** (no standalone components): `AppModule` raíz con `app-routing.module.ts`, y `SharedModule` para lo reutilizable. Esto es una decisión deliberada, no una limitación de versión — `angular.json` fija `standalone: false` como default de los schematics (`ng generate component/directive/pipe`). Al crear un componente/pipe/directiva nuevo, declararlo en el módulo correspondiente (el del feature, o `SharedModule` si es genérico) — no asumir standalone por default.

### Estructura de `src/app/`

```
app/
├── core/
│   ├── components/   # navbar, footer, loading
│   └── interceptors/ # jwt.ts — adjunta Bearer token a los requests
├── features/         # Un directorio por dominio funcional
│   ├── auth/             # login, register, guards, models, services
│   ├── account/
│   ├── card/
│   ├── cardTransactions/
│   ├── transaction/
│   ├── transactionClass/
│   ├── cryptoTransaction/
│   ├── stockTransactions/
│   ├── portfolios/
│   ├── portfolioExchange/
│   ├── CurrencyExchange/
│   ├── exchange/
│   ├── asset/
│   ├── assetType/
│   ├── people/
│   ├── shared-expenses/   # feature en desarrollo, ver docs/plans/gastos-compartidos.md
│   ├── report/
│   └── user/
└── shared/
    ├── directives/
    ├── pipes/        # commerceType, currencyFiatFormat, currencyFiatInputFormat, currencyInvestmentFormat, movementType
    ├── services/
    └── shared.module.ts
```

### Comunicación con la API

El interceptor `core/interceptors/jwt.ts` adjunta el header `Authorization: Bearer <token>` a los requests. La URL base se configura en `src/environments/environment.ts` (`apiUrl`) — cambiarla para apuntar a un backend local o de otro entorno.

### Pipes de formato (`shared/pipes/`)

Para mantener formato consistente, los montos y valores enumerados se formatean siempre a través de estos pipes en lugar de lógica ad-hoc en cada componente:

| Pipe | Uso |
|---|---|
| `currencyFiatFormat` | Formato de moneda fiat para mostrar montos |
| `currencyFiatInputFormat` | Formato de moneda fiat en inputs editables |
| `currencyInvestmentFormat` | Formato numérico para montos de inversión (acciones/crypto) |
| `commerceType` | Traduce el tipo de comercio/transacción a su label |
| `movementType` | Traduce el tipo de movimiento a su label |

Al mostrar un monto o un valor enumerado, preferir el pipe existente (o crear uno nuevo en `shared/pipes/` si la necesidad se repite) antes que formatear el valor manualmente en el componente o el template.

### Tests

Karma + Jasmine. Los specs siguen el patrón `*.spec.ts` junto al archivo que prueban (ver `app-initializer.service.spec.ts` como referencia).

## Deploy

Azure Static Web Apps vía GitHub Actions (`azure-static-web-apps-*.yml`, trigger en push/PR a la rama principal). Deploy manual si hace falta:

```bash
npm run build
npx --yes @azure/static-web-apps-cli deploy ./dist/jaz-finanzas-app.ui/browser --deployment-token "<token>" --env production
```

Nota: desde la migración al builder `application` (esbuild/Vite, ver `docs/plans/migracion-angular.md`), el output queda en una subcarpeta `browser/` dentro de `outputPath` (`dist/jaz-finanzas-app.ui/browser/`), no en la raíz como con el builder clásico — tenerlo en cuenta en cualquier script o configuración que referencie la carpeta de build.
