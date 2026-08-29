export interface TransactionClass {
    id: number;
    description: string;
    incExp: string;
    isSystem?: boolean;
    parentId?: number | null;
    nature?: string | null;
}

// ESSENTIAL / DISCRETIONARY / SAVING — mismos valores que Domain.TransactionClassNature
// en el backend (Fase 5, docs/plans/activos/plan-rediseno-reportes.md).
export const TRANSACTION_CLASS_NATURES = ['ESSENTIAL', 'DISCRETIONARY', 'SAVING'] as const;
export type TransactionClassNatureValue = typeof TRANSACTION_CLASS_NATURES[number];

export const TRANSACTION_CLASS_NATURE_LABELS: Record<TransactionClassNatureValue, string> = {
    ESSENTIAL: 'Esencial',
    DISCRETIONARY: 'Discrecional',
    SAVING: 'Ahorro'
};
