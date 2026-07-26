export interface Card {
    id: number;
    name: string;
    nextClosingDate: string | null;
    nextDueDate: string | null;
    isCurrentPeriodPaid: boolean;
}