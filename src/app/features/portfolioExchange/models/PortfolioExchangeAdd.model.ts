export interface PortfolioExchangeAdd {
    date:  Date;
    assetId: string;
    accountId: string;
    amount: number;
    expensePortfolioId: string;
    incomePortfolioId: string;    
}