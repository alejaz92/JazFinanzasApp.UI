export interface StockStatsDTO {
    stockStatsInd: StockStatsListDTO[];
    stockStatsGral: StocksGralStatsDTO[];
}

export interface StockStatsListDTO {
    assetName: string;
    symbol: string;
    quantity: number;
    originalValue: number;
    actualValue: number;
}

export interface StocksGralStatsDTO {
    assetType: string;
    originalValue: number;
    actualValue: number;
}