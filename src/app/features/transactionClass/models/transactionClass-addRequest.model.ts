export interface TransactionClassAddRequest {
    description: string;
    incExp: string;
    parentId?: number | null;
    nature?: string | null;
}
