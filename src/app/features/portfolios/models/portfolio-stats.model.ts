export interface PortfolioStatsDTO {
    portfolioId: number;
    portfolioName: string;
    isDefault: boolean;
    originalValue: number;
    actualValue: number;
}

export interface PortfolioHoldingDTO {
    assetType: string;
    assetName: string;
    symbol: string;
    accountName: string;
    quantity: number;
    originalValue: number;
    actualValue: number;
}

export interface PortfolioDetailStatsDTO {
    portfolioId: number;
    portfolioName: string;
    originalValue: number;
    actualValue: number;
    holdings: PortfolioHoldingDTO[];
}

export interface PortfolioValueByDateDTO {
    date: Date;
    value: number;
}
