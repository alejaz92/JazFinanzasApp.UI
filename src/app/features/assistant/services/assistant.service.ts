import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import {
    AssistantFeedback,
    AssistantFinding,
    AssistantLatest,
    AssistantReview,
    AssistantReviewKind,
    AssistantReviewSummary,
    AssistantStatus,
    GenerateAssistantReviewRequest,
    SetAssistantFeedbackRequest,
    UpdateAssistantFindingRequest
} from '../models/assistant.model';

// plan-devoluciones-llm.md, D6: endpoints de AssistantController. Salvo `status`, todos responden el error de
// negocio "El asistente no está habilitado para tu usuario" (400) si el usuario no lo tiene habilitado.
@Injectable({
    providedIn: 'root'
})
export class AssistantService {

    private readonly baseUrl = `${environment.apiBaseURL}/api/assistant`;

    constructor(private http: HttpClient) { }

    getStatus(): Observable<AssistantStatus> {
        return this.http.get<AssistantStatus>(`${this.baseUrl}/status`);
    }

    getLatest(): Observable<AssistantLatest> {
        return this.http.get<AssistantLatest>(`${this.baseUrl}/reviews/latest`);
    }

    // Historial de devoluciones vigentes, con filtro opcional por tipo (cierre de mes / mitad de mes).
    getHistory(kind?: Exclude<AssistantReviewKind, 'WeeklyScan'> | null): Observable<AssistantReviewSummary[]> {
        let params = new HttpParams();
        if (kind) params = params.set('kind', kind);
        return this.http.get<AssistantReviewSummary[]>(`${this.baseUrl}/reviews`, { params });
    }

    getReview(id: number): Observable<AssistantReview> {
        return this.http.get<AssistantReview>(`${this.baseUrl}/reviews/${id}`);
    }

    // Genera o regenera. Es sincrónico y puede tardar unos 30 segundos (la llamada al modelo).
    generate(request: GenerateAssistantReviewRequest): Observable<AssistantReview> {
        return this.http.post<AssistantReview>(`${this.baseUrl}/reviews/generate`, request);
    }

    setFeedback(reviewId: number, request: SetAssistantFeedbackRequest): Observable<AssistantFeedback> {
        return this.http.put<AssistantFeedback>(`${this.baseUrl}/reviews/${reviewId}/feedback`, request);
    }

    // Por defecto solo los activos y no vencidos; con `all`, también los descartados y vencidos.
    getFindings(all = false): Observable<AssistantFinding[]> {
        const params = new HttpParams().set('all', all);
        return this.http.get<AssistantFinding[]>(`${this.baseUrl}/findings`, { params });
    }

    updateFinding(id: number, request: UpdateAssistantFindingRequest): Observable<AssistantFinding> {
        return this.http.put<AssistantFinding>(`${this.baseUrl}/findings/${id}`, request);
    }
}
