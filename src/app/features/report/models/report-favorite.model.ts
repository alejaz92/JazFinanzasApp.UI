// Fase 24/25 (Bloque F, plan de rediseño de Reportes). `reportKey` es opaco para el backend: acá es
// la ruta relativa a `/report/` + query params si el reporte los usa (ej.
// "shared-events-by-person?personId=3") — mismo criterio que "enlaces que se pueden guardar"
// (sección 7 del plan).
export interface ReportFavorite {
  id: number;
  reportKey: string;
  order: number;
}
