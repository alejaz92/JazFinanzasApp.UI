import { Balance } from "./Balance.modelt";
import { CryptoStatsByDateDTO } from "./CryptoGralStats.model";

export interface CryptoStatsDTO {
    cryptoEvolutionStats: CryptoStatsByDateDTO[];
    cryptoBalanceStats: Balance[];
    cryptoTransactionsStats: InvestmentTransactionsStatsDTO[];
    cryptoRangeValuesStats: InvestmentRangeValuesStatsDTO;
}

export interface InvestmentTransactionsStatsDTO {
    date: Date;
    account: string;
    movementType: string;
    commerceType: string;
    quantity: number;
    quotePrice: number;
    total: number;
}

export interface InvestmentRangeValuesStatsDTO {
    minValue: number;
    maxValue: number;
    currentValue: number;
}