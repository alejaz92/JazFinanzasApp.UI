export interface IncExpStats {
    classIncomeStats: ClassIncomeStats[];
    classExpenseStats: ClassExpenseStats[];
    monthIncomeStats: MonthIncomeStats[];
    monthExpenseStats: MonthExpenseStats[];
}

export interface ClassIncomeStats {
    transactionClass: string;
    amount: number;
}

export interface ClassExpenseStats {
    transactionClass: string;
    amount: number;
}

export interface MonthIncomeStats {
    month: Date;
    amount: number;
}

export interface MonthExpenseStats {
    month: Date;
    amount: number;
}

