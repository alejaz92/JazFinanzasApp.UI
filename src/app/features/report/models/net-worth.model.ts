export interface NetWorthTotal {
    asset: string;
    symbol: string;
    color: string;
    grossBalance: number;
    cardDebt: number;
    netBalance: number;
}

export interface StaleAsset {
    assetName: string;
    quoteDate: string;
}

export interface NetWorthGeneral {
    totals: NetWorthTotal[];
    staleAssets: StaleAsset[];
}

export interface NetWorthMonthlyPoint {
    month: string;
    accounts: number;
    stocks: number;
    crypto: number;
    bonds: number;
    total: number;
}

export interface MonthlyBalancePoint {
    month: string;
    balance: number;
}

export interface AccountHolding {
    assetId: number;
    assetName: string;
    assetSymbol: string;
    nativeBalance: number;
    balanceInReferenceAsset: number;
}

export interface AccountBalance {
    accountId: number;
    accountName: string;
    balance: number;
    evolution: MonthlyBalancePoint[];
    holdings: AccountHolding[];
}

export interface CurrencyExposure {
    label: string;
    balance: number;
    percentage: number;
}
