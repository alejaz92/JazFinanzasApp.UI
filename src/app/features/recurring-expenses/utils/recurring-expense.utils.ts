import { RecurringFrequency, RecurringMonthMark, RecurringMonthState } from '../models/recurring-expense.model';

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// "2026-11-01T00:00:00" o "2026-11" → "noviembre 2026". Se lee el texto: pasar por Date correría el mes según la zona horaria.
export function monthLabel(value: string | null | undefined): string {
  if (!value) return '';
  const [year, month] = value.substring(0, 7).split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

// El valor de un <input type="month">.
export function monthValue(value: string | Date): string {
  if (typeof value === 'string') return value.substring(0, 7);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
}

// El valor de un <input type="month"> como lo espera la API.
export function monthToApi(value: string): string {
  return `${value.substring(0, 7)}-01`;
}

export function nextMonthValue(value: string): string {
  const [year, month] = value.substring(0, 7).split('-').map(Number);
  return monthValue(new Date(year, month, 1));
}

export function dateValue(date: Date): string {
  return `${monthValue(date)}-${String(date.getDate()).padStart(2, '0')}`;
}

// "ARS" y "USD" son los símbolos de las monedas; en pantalla van como "$" y "US$".
export function currencySymbol(assetSymbol: string): string {
  switch (assetSymbol) {
    case 'ARS': return '$';
    case 'USD': return 'US$';
    default: return assetSymbol;
  }
}

// Un monto escrito en un campo con appCurrencyInput ("22.777,48", "22777,48" o 22777.48). NaN si no es un número.
export function parseAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined || value === '') return NaN;

  const text = String(value);
  let normalized: string;
  if (text.includes('.') && text.includes(',')) normalized = text.replace(/\./g, '').replace(',', '.');
  else if (text.includes('.')) normalized = text.replace(/,/g, '');
  else normalized = text.replace(',', '.');
  return parseFloat(normalized);
}

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  MONTHLY: 'Todos los meses',
  BIMONTHLY: 'Cada dos meses',
  NONE: 'Sin frecuencia fija'
};

export const STATE_LABELS: Record<RecurringMonthState, string> = {
  Paid: 'Pagado',
  Estimated: 'Esperado',
  NoCharge: 'Sin cargo',
  NotCharged: 'No vino en el resumen',
  Unpaid: 'Sin pagar'
};

export const STATE_BADGES: Record<RecurringMonthState, string> = {
  Paid: 'text-bg-success',
  Estimated: 'text-bg-info',
  NoCharge: 'text-bg-secondary',
  NotCharged: 'text-bg-warning',
  Unpaid: 'text-bg-danger'
};

export const MARK_LABELS: Record<RecurringMonthMark, string> = {
  DEFERRED: 'Atrasado: se espera en el resumen siguiente',
  NO_CHARGE: 'Marcado sin cargo',
  PENDING: 'No vino y no se sabe por qué'
};
