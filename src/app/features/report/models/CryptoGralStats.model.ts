import { StockStatsListDTO } from "./StockStats.model";

export interface CryptoGralStatsDTO {
    cryptoGralStats: StockStatsListDTO[];
    cryptoStatsByDate: CryptoStatsByDateDTO[];
    cryptoPurchasesStatsByMonth: CryptoStatsByDateCommerceDTO[];
}

export interface CryptoStatsByDateDTO {
    date: Date;
    value: number;
}

export interface CryptoStatsByDateCommerceDTO {
    date: Date;
    commerceType: string;
    value: number;
}