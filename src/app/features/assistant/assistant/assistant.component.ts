import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AssistantService } from '../services/assistant.service';
import {
    AssistantFinding,
    AssistantReview,
    AssistantReviewKind,
    AssistantReviewSummary,
    AssistantStatus
} from '../models/assistant.model';
import { formatDayMonth, formatUsd, parseUtc, reviewKindLabel, reviewPeriodLabel, usagePercent } from '../utils/assistant.util';
import { AssistantMarkdownComponent } from '../components/assistant-markdown/assistant-markdown.component';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { InfoButtonComponent } from '../../../shared/components/info-button/info-button.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../../core/services/toast.service';

type Tab = 'reviews' | 'findings';
type KindFilter = 'all' | 'MonthClose' | 'MidMonth';

// Pantalla "Asistente" (plan-devoluciones-llm.md, Fase 11): historial de devoluciones, detalle con calificación y
// regeneración, historial de hallazgos y lo gastado en el mes contra el tope. La entrada de menú y la tarjeta de
// Inicio llegan en la Fase 12; hasta entonces la pantalla no está enlazada desde ningún lado.
@Component({
    selector: 'app-assistant',
    standalone: true,
    imports: [NgIf, NgFor, NgClass, DatePipe, FormsModule, LoadingComponent, InfoButtonComponent, SubmitButtonComponent,
        ConfirmModalComponent, AssistantMarkdownComponent],
    templateUrl: './assistant.component.html',
    styleUrl: './assistant.component.css'
})
export class AssistantComponent implements OnInit {
    private readonly assistantService = inject(AssistantService);
    private readonly toastService = inject(ToastService);
    private readonly route = inject(ActivatedRoute);

    @ViewChild('regenerateModal') regenerateModal!: ConfirmModalComponent;

    tab: Tab = 'reviews';

    // Uso del mes.
    status: AssistantStatus | null = null;
    isLoadingStatus = true;

    // Historial de devoluciones.
    history: AssistantReviewSummary[] = [];
    kindFilter: KindFilter = 'all';
    isLoadingHistory = false;

    // Detalle.
    selected: AssistantReview | null = null;
    isLoadingDetail = false;
    isRegenerating = false;

    // Calificación del detalle seleccionado.
    ratingDraft: number | null = null;
    wrongFiguresDraft = false;
    commentDraft = '';
    isSavingFeedback = false;

    // Hallazgos.
    findings: AssistantFinding[] = [];
    isLoadingFindings = false;
    findingsLoaded = false;
    busyFindingId: number | null = null;

    // Si el detalle viene de un link ("Leer completa" en Inicio, Fase 12): ?review=<id>.
    private requestedReviewId: number | null = null;

    ngOnInit(): void {
        const param = Number(this.route.snapshot.queryParamMap.get('review'));
        this.requestedReviewId = Number.isFinite(param) && param > 0 ? param : null;

        this.assistantService.getStatus().subscribe({
            next: status => {
                this.status = status;
                this.isLoadingStatus = false;
                if (status.enabled) this.loadHistory();
            },
            error: () => {
                this.isLoadingStatus = false;
                this.toastService.error('No se pudo consultar el estado del asistente.');
            }
        });
    }

    // ── Presentación ─────────────────────────────────────────────────────────────────────────────────────────

    periodLabel = reviewPeriodLabel;
    kindLabel = reviewKindLabel;
    dayMonth = formatDayMonth;
    usd = formatUsd;
    toDate = parseUtc;

    get usagePercent(): number {
        return this.status ? usagePercent(this.status.spentUsd, this.status.monthlyBudgetUsd) : 0;
    }

    get usageBarClass(): string {
        if (!this.status) return 'bg-primary';
        if (this.status.budgetReached) return 'bg-danger';
        return this.usagePercent >= 80 ? 'bg-warning' : 'bg-primary';
    }

    get renewsOnLabel(): string {
        return this.status ? this.dayMonth(this.status.renewsOn) : '';
    }

    // La mitad de mes solo se puede regenerar para el mes en curso (lo exige el backend); un cierre, de cualquier mes ya terminado.
    get canRegenerate(): boolean {
        if (!this.selected || this.selected.purpose !== 'User') return false;
        if (this.selected.kind === 'MonthClose') return true;
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        return this.selected.kind === 'MidMonth' && this.selected.periodStart.slice(0, 7) === currentMonth;
    }

    ratingLabel(rating: number | null): string {
        return rating === 1 ? 'Útil' : rating === -1 ? 'No útil' : 'Sin calificar';
    }

    findingStatusLabel(status: AssistantFinding['status']): string {
        return status === 'Active' ? 'Activo' : status === 'Dismissed' ? 'Descartado' : 'Vencido';
    }

    findingStatusClass(status: AssistantFinding['status']): string {
        return status === 'Active' ? 'text-bg-primary' : 'text-bg-secondary';
    }

    // ── Pestañas ─────────────────────────────────────────────────────────────────────────────────────────────

    selectTab(tab: Tab): void {
        this.tab = tab;
        if (tab === 'findings' && !this.findingsLoaded) this.loadFindings();
    }

    // ── Devoluciones ─────────────────────────────────────────────────────────────────────────────────────────

    setKindFilter(filter: KindFilter): void {
        if (this.kindFilter === filter) return;
        this.kindFilter = filter;
        this.loadHistory();
    }

    private loadHistory(selectId?: number): void {
        this.isLoadingHistory = true;
        const kind = this.kindFilter === 'all' ? null : this.kindFilter;
        this.assistantService.getHistory(kind).subscribe({
            next: history => {
                this.history = history;
                this.isLoadingHistory = false;
                // Se abre lo pedido (una versión recién generada, o el link ?review=), aunque quede fuera del filtro.
                const wanted = selectId ?? this.requestedReviewId;
                this.requestedReviewId = null;
                if (wanted != null) {
                    this.openReview(wanted);
                } else if (this.selected && history.some(h => h.id === this.selected!.id)) {
                    // Se conserva el detalle abierto si sigue en la lista.
                } else if (history.length > 0) {
                    this.openReview(history[0].id);
                } else {
                    this.selected = null;
                }
            },
            error: error => {
                this.isLoadingHistory = false;
                this.toastService.error(this.messageOf(error, 'No se pudo cargar el historial.'));
            }
        });
    }

    openReview(id: number): void {
        if (this.selected?.id === id && !this.isLoadingDetail) return;
        this.isLoadingDetail = true;
        this.assistantService.getReview(id).subscribe({
            next: review => {
                this.selected = review;
                this.isLoadingDetail = false;
                this.ratingDraft = review.feedback?.rating ?? null;
                this.wrongFiguresDraft = review.feedback?.hasWrongFigures ?? false;
                this.commentDraft = review.feedback?.comment ?? '';
            },
            error: error => {
                this.isLoadingDetail = false;
                this.toastService.error(this.messageOf(error, 'No se pudo cargar la devolución.'));
            }
        });
    }

    setRating(rating: number): void {
        this.ratingDraft = this.ratingDraft === rating ? null : rating;
    }

    saveFeedback(): void {
        if (!this.selected || this.ratingDraft == null) return;
        const reviewId = this.selected.id;
        this.isSavingFeedback = true;
        this.assistantService.setFeedback(reviewId, {
            rating: this.ratingDraft,
            hasWrongFigures: this.wrongFiguresDraft,
            comment: this.commentDraft.trim() || null
        }).subscribe({
            next: feedback => {
                this.isSavingFeedback = false;
                if (this.selected?.id === reviewId) this.selected = { ...this.selected, feedback };
                const row = this.history.find(h => h.id === reviewId);
                if (row) row.rating = feedback.rating;
                this.toastService.success('Calificación guardada.');
            },
            error: error => {
                this.isSavingFeedback = false;
                this.toastService.error(this.messageOf(error, 'No se pudo guardar la calificación.'));
            }
        });
    }

    askRegenerate(): void {
        this.regenerateModal.open();
    }

    regenerate(): void {
        if (!this.selected || this.isRegenerating) return;
        const current = this.selected;
        this.isRegenerating = true;
        this.assistantService.generate({ kind: current.kind, periodStart: current.periodStart, regenerate: true }).subscribe({
            next: review => {
                this.isRegenerating = false;
                if (review.status === 'Ready') {
                    this.toastService.success('Se generó una versión nueva.');
                    this.loadHistory(review.id);
                } else {
                    // Falló (tope, negativa, corte): la versión anterior sigue siendo la vigente.
                    this.toastService.error(review.errorMessage ?? 'No se pudo generar la devolución.');
                }
            },
            error: error => {
                this.isRegenerating = false;
                this.toastService.error(this.messageOf(error, 'No se pudo generar la devolución.'));
            }
        });
    }

    // ── Hallazgos ────────────────────────────────────────────────────────────────────────────────────────────

    private loadFindings(): void {
        this.isLoadingFindings = true;
        this.assistantService.getFindings(true).subscribe({
            next: findings => {
                this.findings = findings;
                this.isLoadingFindings = false;
                this.findingsLoaded = true;
            },
            error: error => {
                this.isLoadingFindings = false;
                this.toastService.error(this.messageOf(error, 'No se pudieron cargar los hallazgos.'));
            }
        });
    }

    rateFinding(finding: AssistantFinding, rating: number): void {
        // Tocar de nuevo la misma calificación no hace nada: el backend no tiene "sin calificar".
        if (finding.rating === rating) return;
        this.updateFinding(finding, { rating });
    }

    dismissFinding(finding: AssistantFinding): void {
        this.updateFinding(finding, { dismiss: true });
    }

    private updateFinding(finding: AssistantFinding, request: { dismiss?: boolean; rating?: number }): void {
        this.busyFindingId = finding.id;
        this.assistantService.updateFinding(finding.id, request).subscribe({
            next: updated => {
                this.busyFindingId = null;
                this.findings = this.findings.map(f => f.id === updated.id ? updated : f);
            },
            error: error => {
                this.busyFindingId = null;
                this.toastService.error(this.messageOf(error, 'No se pudo actualizar el hallazgo.'));
            }
        });
    }

    // El backend responde los errores de negocio como { statusCode, error, message } (ExceptionHandlingMiddleware).
    private messageOf(error: any, fallback: string): string {
        return error?.error?.message ?? fallback;
    }
}
