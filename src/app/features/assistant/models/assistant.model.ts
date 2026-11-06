// Modelos del asistente (plan-devoluciones-llm.md, Fase 11). Espejo de Business/DTOs/Assistant/AssistantDTOs.cs.

export type AssistantReviewKind = 'MonthClose' | 'MidMonth' | 'WeeklyScan';

// Pending solo mientras se genera; NoActivity no llega al historial.
export type AssistantReviewStatus = 'Pending' | 'Ready' | 'Failed' | 'NoActivity';

export type AssistantFindingStatus = 'Active' | 'Dismissed' | 'Expired';

export interface AssistantStatus {
    enabled: boolean;
    monthlyBudgetUsd: number;
    spentUsd: number;
    // Primer día del mes siguiente (el límite se renueva el 1 de cada mes, en UTC).
    renewsOn: string;
    budgetReached: boolean;
}

export interface AssistantFeedback {
    // +1 útil / -1 no útil.
    rating: number;
    hasWrongFigures: boolean;
    comment: string | null;
}

export interface AssistantReviewSummary {
    id: number;
    kind: AssistantReviewKind;
    periodStart: string;
    cutoffDate: string;
    status: AssistantReviewStatus;
    headline: string | null;
    hasUnverifiedFigures: boolean;
    rating: number | null;
    createdAt: string;
}

export interface AssistantReview {
    id: number;
    kind: AssistantReviewKind;
    periodStart: string;
    // Último día con datos incluido.
    cutoffDate: string;
    status: AssistantReviewStatus;
    isCurrent: boolean;
    purpose: 'User' | 'Eval';
    headline: string | null;
    highlights: string[];
    // Markdown.
    body: string | null;
    // "Cifras a revisar": las del texto que no se encontraron en los datos.
    unverifiedFigures: string[];
    // Lo que faltaba en los datos al prepararla ("armada sin…"); vacío si estaba todo.
    dataNotes: string[];
    errorMessage: string | null;
    promptVersion: string | null;
    model: string | null;
    createdAt: string;
    feedback: AssistantFeedback | null;
}

// Por qué todavía no está la devolución que falta (plan-devoluciones-llm-v2.md, D7).
export type AssistantLatestOutlook = 'Scheduled' | 'WaitingForData' | 'LastRunFailed' | 'SchedulerNotRun';

export interface AssistantLatest {
    state: 'Ready' | 'NotGenerated' | 'Empty';
    missingKind: AssistantReviewKind | null;
    missingPeriodStart: string | null;
    // Con state NotGenerated trae igual la última devolución que hay, para seguir mostrándola.
    review: AssistantReview | null;
    weeklyScanDue: boolean;
    // Hay una pasada generándose ahora (a pedido o de madrugada).
    preparing: boolean;
    // Solo con state NotGenerated.
    outlook: AssistantLatestOutlook | null;
    // Con WaitingForData: lo que le falta al mes.
    outlookNotes: string[];
}

export interface AssistantFinding {
    id: number;
    reviewId: number;
    title: string;
    detail: string;
    transactionClassId: number | null;
    status: AssistantFindingStatus;
    expiresAt: string;
    // +1 útil / -1 no útil; null si no se calificó.
    rating: number | null;
    unverifiedFigures: string[];
    createdAt: string;
}

export interface GenerateAssistantReviewRequest {
    kind: AssistantReviewKind;
    periodStart?: string | null;
    regenerate: boolean;
}

export interface SetAssistantFeedbackRequest {
    rating: number;
    hasWrongFigures: boolean;
    comment: string | null;
}

export interface UpdateAssistantFindingRequest {
    dismiss?: boolean;
    rating?: number;
}
