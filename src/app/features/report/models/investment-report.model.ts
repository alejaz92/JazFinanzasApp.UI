// Fase 20 (Inversiones, frontend) — DTOs de InvestmentReportController (Fase 19). assetId es
// siempre la moneda elegida en la barra de Reportes (T12), igual que Tarjetas/Patrimonio.

export interface InvestmentHolding {
    assetId: number;
    assetName: string;
    symbol: string;
    // Stocks | Bonds | CryptoStable | CryptoVolatile — mismo bucket que la línea de Patrimonio.
    bucket: string;
    quantity: number;
    originalValue: number;
    actualValue: number;
    gainLossPercent: number | null;
}

export interface InvestmentValuePoint {
    month: string;
    value: number;
}

export interface InvestmentContributionMarker {
    month: string;
    contributed: number;
    withdrawn: number;
}

export interface InvestmentOverview {
    referenceAssetSymbol: string;
    totalOriginalValue: number;
    totalActualValue: number;
    gainLossPercent: number | null;
    holdings: InvestmentHolding[];
    valueSeries: InvestmentValuePoint[];
    contributionMarkers: InvestmentContributionMarker[];
}

export interface PortfolioOverviewItem {
    portfolioId: number;
    portfolioName: string;
    isDefault: boolean;
    originalValue: number;
    actualValue: number;
    gainLossPercent: number | null;
    sharePercent: number;
}

export interface PortfoliosOverview {
    referenceAssetSymbol: string;
    portfolios: PortfolioOverviewItem[];
}

export interface PortfolioHoldingItem {
    assetType: string;
    assetName: string;
    symbol: string;
    accountName: string;
    quantity: number;
    originalValue: number;
    actualValue: number;
    gainLossPercent: number | null;
    // Calculadas en el backend sobre valores sin redondear (2026-09-10) — dividir originalValue/
    // actualValue (ya redondeados a 2 decimales) acá en el frontend daba una cotización levemente
    // distinta por cuenta para un mismo activo el mismo día. Null si quantity es 0.
    originQuote: number | null;
    currentQuote: number | null;
}

export interface PortfolioDetailReport {
    portfolioId: number;
    portfolioName: string;
    referenceAssetSymbol: string;
    originalValue: number;
    actualValue: number;
    gainLossPercent: number | null;
    holdings: PortfolioHoldingItem[];
    valueSeries: InvestmentValuePoint[];
}

export interface StockTickerReport {
    assetName: string;
    symbol: string;
    quantity: number;
    originalValue: number;
    actualValue: number;
    gainLossAmount: number;
    gainLossPercent: number | null;
    weightPercent: number;
}

export interface StocksReport {
    referenceAssetSymbol: string;
    totalOriginalValue: number;
    totalActualValue: number;
    tickers: StockTickerReport[];
}

export interface CryptoPurchaseMonth {
    date: string;
    commerceType: string;
    value: number;
}

export interface CryptoOverviewReport {
    referenceAssetSymbol: string;
    totalOriginalValue: number;
    totalActualValue: number;
    holdings: StockTickerReport[];
    valueEvolution: InvestmentValuePoint[];
    purchasesByMonth: CryptoPurchaseMonth[];
}

export interface CryptoTransactionMarker {
    date: string;
    account: string;
    // "I" compra, "E" venta.
    movementType: string;
    commerceType: string;
    quantity: number;
    quotePrice: number;
    total: number;
}

export interface AccountHoldingAmount {
    account: string;
    balance: number;
}

export interface CryptoDetailReport {
    assetId: number;
    assetName: string;
    symbol: string;
    referenceAssetSymbol: string;
    averageBuyPrice: number;
    minPrice: number;
    maxPrice: number;
    currentPrice: number;
    priceEvolution: InvestmentValuePoint[];
    transactions: CryptoTransactionMarker[];
    balanceByAccount: AccountHoldingAmount[];
}

export interface ContributionsVsPerformance {
    referenceAssetSymbol: string;
    startMonth: string;
    initialValue: number;
    contributed: number;
    withdrawn: number;
    valuation: number;
    finalValue: number;
}
