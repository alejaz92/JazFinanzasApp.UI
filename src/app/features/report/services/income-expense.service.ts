import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { IncExpWaterfall, IncExpEvolutionPoint, SpendingByCategory, TagSpending, SpendingCalendar, IncomeCategorySeries, IncomeComposition, IncomeCategoryDay } from '../models/income-expense.model';

@Injectable({
    providedIn: 'root'
})
export class IncomeExpenseService {

    constructor(private http: HttpClient) { }

    getWaterfall(assetId: number, month: string): Observable<IncExpWaterfall> {
        return this.http.get<IncExpWaterfall>(`${environment.apiBaseURL}/api/IncomeExpenseReport/Waterfall/${assetId}?month=${month}`);
    }

    getEvolution(assetId: number, months: number): Observable<IncExpEvolutionPoint[]> {
        return this.http.get<IncExpEvolutionPoint[]>(`${environment.apiBaseURL}/api/IncomeExpenseReport/Evolution/${assetId}?months=${months}`);
    }

    getByCategory(assetId: number, month: string): Observable<SpendingByCategory> {
        return this.http.get<SpendingByCategory>(`${environment.apiBaseURL}/api/IncomeExpenseReport/ByCategory/${assetId}?month=${month}`);
    }

    getByTag(assetId: number, months: number): Observable<TagSpending[]> {
        return this.http.get<TagSpending[]>(`${environment.apiBaseURL}/api/IncomeExpenseReport/ByTag/${assetId}?months=${months}`);
    }

    getCalendar(assetId: number, year: number): Observable<SpendingCalendar> {
        return this.http.get<SpendingCalendar>(`${environment.apiBaseURL}/api/IncomeExpenseReport/Calendar/${assetId}?year=${year}`);
    }

    getIncomeComposition(assetId: number, month: string): Observable<IncomeComposition> {
        return this.http.get<IncomeComposition>(`${environment.apiBaseURL}/api/IncomeExpenseReport/IncomeComposition/${assetId}?month=${month}`);
    }

    getIncomeByCategory(assetId: number, months: number): Observable<IncomeCategorySeries[]> {
        return this.http.get<IncomeCategorySeries[]>(`${environment.apiBaseURL}/api/IncomeExpenseReport/IncomeByCategory/${assetId}?months=${months}`);
    }

    getIncomeByCategoryAndDay(assetId: number, months: number): Observable<IncomeCategoryDay[]> {
        return this.http.get<IncomeCategoryDay[]>(`${environment.apiBaseURL}/api/IncomeExpenseReport/IncomeByCategoryAndDay/${assetId}?months=${months}`);
    }
}
