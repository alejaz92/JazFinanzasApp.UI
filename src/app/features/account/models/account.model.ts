export interface Account {
    id: number;
    name: string;
    userId: number;
    type?: string | null;
    countsAsLiquid: boolean;
}

// CASH / BANK / WALLET / INVESTMENT / OTHER — mismos valores que Domain.AccountType
// en el backend (Fase 5, docs/plans/activos/plan-rediseno-reportes.md).
export const ACCOUNT_TYPES = ['CASH', 'BANK', 'WALLET', 'INVESTMENT', 'OTHER'] as const;
export type AccountTypeValue = typeof ACCOUNT_TYPES[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountTypeValue, string> = {
    CASH: 'Efectivo',
    BANK: 'Banco',
    WALLET: 'Billetera virtual',
    INVESTMENT: 'Inversión',
    OTHER: 'Otro'
};
