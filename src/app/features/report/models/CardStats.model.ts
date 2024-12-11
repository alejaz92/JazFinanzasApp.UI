import { CardTransactionPaymentList } from "../../cardTransactions/models/CardTransactionPayment-List.model";

export interface CardStats {
    pesosCardGraphDTO: CardStatsGraph[];
    dollarsCardGraphDTO: CardStatsGraph[];
    cardTransactionsDTO: CardTransactionPaymentList[];
}

export interface CardStatsGraph{
    month: Date;
    amount: number;
}