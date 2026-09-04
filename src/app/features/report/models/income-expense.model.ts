export interface WaterfallStep {
    categoryName: string;
    amount: number;
}

export interface IncExpWaterfall {
    month: string;
    totalIncome: number;
    expenseSteps: WaterfallStep[];
    totalExpense: number;
    result: number;
    previousMonthResult: number;
}

export interface IncExpEvolutionPoint {
    month: string;
    income: number;
    expense: number;
    result: number;
    cumulativeResult: number;
    expenseMovingAverage: number | null;
}

export interface CategoryDetail {
    categoryId: number;
    categoryName: string;
    amount: number;
    monthlyTrend: number[];
    rankCurrent: number;
    rankPrevious: number | null;
}

export interface CategoryGroup {
    groupId: number;
    groupName: string;
    amount: number;
    categories: CategoryDetail[];
}

export interface SpendingByCategory {
    month: string;
    groups: CategoryGroup[];
}

export interface MonthlyAmount {
    month: string;
    amount: number;
}

export interface CategoryAmount {
    categoryName: string;
    amount: number;
}

export interface TagSpending {
    tagId: number;
    tagName: string;
    color: string | null;
    totalAmount: number;
    monthlyEvolution: MonthlyAmount[];
    byCategory: CategoryAmount[];
}

export interface DaySpending {
    date: string;
    amount: number;
}

export interface WeekdayAverage {
    dayOfWeek: number;
    average: number;
}

export interface SpendingCalendar {
    year: number;
    days: DaySpending[];
    weekdayAverages: WeekdayAverage[];
}

export interface IncomeCategorySeries {
    categoryId: number;
    categoryName: string;
    monthlyTrend: number[];
}

export interface IncomeCategoryAmount {
    categoryId: number;
    categoryName: string;
    amount: number;
}

export interface IncomeComposition {
    month: string;
    categories: IncomeCategoryAmount[];
}

export interface IncomeCategoryDay {
    categoryId: number;
    categoryName: string;
    date: string;
    amount: number;
}
