import { StocksGralStatsDTO, StockStatsListDTO } from "./StockStats.model";

export interface HomeStatsDTO {
    stockStatsGral: StocksGralStatsDTO[];
    cryptoStatsGral: StockStatsListDTO[];
}