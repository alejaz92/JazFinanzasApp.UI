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
    // plan-amortizaciones-bonos, Fase 9: lo ya cobrado de un bono (intereses + devoluciones de
    // capital), en la moneda de referencia. gainLossPercent ya lo incluye; originalValue no cambia.
    collectedValue: number;
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
    totalCollectedValue: number;
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
    collectedValue: number;
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
    collectedValue: number;
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
    collectedValue: number;
    gainLossPercent: number | null;
    holdings: PortfolioHoldingItem[];
    valueSeries: InvestmentValuePoint[];
}

export interface StockTickerReport {
    // assetId y assetTypeName (revisión de Bolsa, 2026-09-12): habilitan el enlace a Bolsa —
    // Detalle y la agrupación/filtro por tipo de activo (D-11).
    assetId: number;
    assetTypeName: string;
    assetName: string;
    symbol: string;
    quantity: number;
    originalValue: number;
    actualValue: number;
    collectedValue: number;
    gainLossAmount: number;
    gainLossPercent: number | null;
    weightPercent: number;
}

// D-12: reemplaza al ranking de 30 barras por ticker — una barra por tipo de activo.
export interface StockTypeAggregate {
    assetTypeName: string;
    tickerCount: number;
    originalValue: number;
    actualValue: number;
    collectedValue: number;
    gainLossPercent: number | null;
}

// D-13: un mes, con el valor de cada tipo de activo dentro de Bolsa.
export interface AssetTypeValue {
    assetTypeName: string;
    value: number;
}

export interface StocksMonthlyPoint {
    month: string;
    byType: AssetTypeValue[];
}

// D-14: una posición de Bolsa con tenencia neta cero.
export interface ClosedPosition {
    assetId: number;
    assetName: string;
    symbol: string;
    assetTypeName: string;
    // Ya incluye collectedValue (lo cobrado de un bono vendido del todo).
    realizedResult: number;
    collectedValue: number;
    lastMovementDate: string;
}

export interface StocksReport {
    referenceAssetSymbol: string;
    totalOriginalValue: number;
    totalActualValue: number;
    totalCollectedValue: number;
    // Agregados por tipo, siempre sobre el entorno completo — el filtro de la barra (D-11) recorta
    // tickers, no esta lista.
    types: StockTypeAggregate[];
    tickers: StockTickerReport[];
    valueSeries: StocksMonthlyPoint[];
    // Vacía salvo que se pida con includeClosed=true (apagado por default, D-14).
    closedPositions: ClosedPosition[];
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

// D-16 (revisión de Bolsa, 2026-09-12): una marca vertical en la línea de cotización.
export interface AssetSplitEventMarker {
    date: string;
    splitRatio: number;
}

// D-15: cantidad, invertido, valor actual, ganancia/pérdida y peso dentro de su propia categoría.
export interface AssetPosition {
    quantity: number;
    originalValue: number;
    actualValue: number;
    // plan-amortizaciones-bonos, Fase 12: lo ya cobrado de un bono (moneda de referencia); gainLossPercent lo incluye.
    collectedValue: number;
    gainLossPercent: number | null;
    weightPercent: number;
}

// plan-amortizaciones-bonos, Fase 13: estado de un pago del cronograma para el usuario.
// Registered / Untracked / Dismissed: ya tiene registro de cobro. Pending: ya pasó, tenías el bono y
// falta registrarlo. Future: todavía no llegó. NotHeld: ya pasó y no tenías el bono ese día.
export type BondScheduleStatus = 'Registered' | 'Untracked' | 'Dismissed' | 'Pending' | 'Future' | 'NotHeld';

export interface BondPaymentScheduleItem {
    paymentDate: string;
    // Por cada 100 nominales originales. Si isIndexed es solo informativo (el monto real depende del ajuste).
    interestPer100: number;
    // Fracción (0.08 = 8%) del capital original que amortiza en este pago.
    amortizationRate: number;
    // Capital vivo por cada 100 nominales originales DESPUÉS de este pago.
    residualAfterPer100: number;
    isIndexed: boolean;
    status: BondScheduleStatus;
    // Lo cobrado de este pago, en la moneda del bono (bondCurrencySymbol).
    collectedCapital: number;
    collectedInterest: number;
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
    // Splits (D-16) y posición (D-15) — sumados en la revisión de Bolsa 2026-09-12 al generalizar
    // el detalle (T17, backend). Cryptos — Detalle no los usa todavía (splitEvents siempre vacío
    // hoy, ninguna cripto tiene splits cargados), pero viajan igual porque es el mismo endpoint.
    splitEvents: AssetSplitEventMarker[];
    position: AssetPosition | null;
    // plan-amortizaciones-bonos, Fase 12: vacío / null para un activo sin cronograma (acciones, cripto).
    bondSchedule: BondPaymentScheduleItem[];
    // Moneda en la que paga el bono (no la de referencia del reporte).
    bondCurrencySymbol: string | null;
    // Capital vivo hoy por cada 100 nominales originales.
    residualPer100: number | null;
}

// El detalle de un activo (T17): mismo shape que CryptoDetailReport, el nombre quedó atrás de la
// generalización del backend. Bolsa — Detalle usa este alias; Cryptos — Detalle sigue usando el
// nombre viejo (mismo tipo).
export type AssetDetailReport = CryptoDetailReport;

export interface ContributionsVsPerformance {
    referenceAssetSymbol: string;
    startMonth: string;
    initialValue: number;
    contributed: number;
    // Incluye lo cobrado de bonos (capital + interés) — plan-amortizaciones-bonos, T12.
    withdrawn: number;
    // Incluye los intereses cobrados: la valorización de precio pura es valuation - interestCollected.
    valuation: number;
    interestCollected: number;
    finalValue: number;
}
