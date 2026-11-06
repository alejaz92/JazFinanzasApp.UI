import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AssistantService } from '../../services/assistant.service';
import { AssistantFinding, AssistantLatest, AssistantReview } from '../../models/assistant.model';
import { maskMoney, reviewPeriodLabel } from '../../utils/assistant.util';
import { FindingActionsComponent } from '../finding-actions/finding-actions.component';

type CardState = 'loading' | 'visible' | 'hidden';

// Las tres formas de mostrar titular, puntos y hallazgos (plan-devoluciones-llm-v2.md, D9). Se alternan desde la propia tarjeta
// mientras dura la verificación, para elegir viéndolas con datos reales; una fase posterior saca las que no queden.
export type CardVariant = 'full' | 'compact' | 'points';

export const CARD_VARIANT_STORAGE_KEY = 'assistantCardVariant';

export const CARD_VARIANTS: { id: CardVariant; label: string; help: string }[] = [
    { id: 'full', label: 'Completa', help: 'Titular, los tres puntos y los hallazgos con su detalle' },
    { id: 'compact', label: 'Compacta', help: 'Titular y los hallazgos; los tres puntos, plegados' },
    { id: 'points', label: 'Puntos', help: 'Titular y los tres puntos; los hallazgos, plegados' }
];

// Tarjeta del asistente en Inicio (plan-devoluciones-llm-v2.md, D7 y D9). Muestra la última devolución y, adentro, los hallazgos
// activos con sus botones (ya no pasan por la bandeja). **Ya no genera sola**: las devoluciones las prepara de madrugada un servicio
// aparte; si falta una, la tarjeta dice por qué todavía no está ("se prepara esta madrugada", "espera a que el mes esté completo",
// "falló anoche"...) y deja un botón para generarla ahora. Mientras una se está preparando, consulta cada pocos segundos.
//
// Si el asistente no está habilitado para el usuario, o cualquier consulta falla sin nada para mostrar, la tarjeta no aparece:
// Inicio no tiene que mostrar errores ni un hueco por algo que es un extra.
@Component({
    selector: 'app-assistant-card',
    standalone: true,
    imports: [NgIf, NgFor, NgClass, NgTemplateOutlet, RouterLink, FindingActionsComponent],
    template: `
        <div class="card mb-3" *ngIf="state === 'visible'">
            <div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <span>
                    <i class="bi bi-stars me-1"></i>Asistente
                    <span class="text-body-secondary" *ngIf="review"> — {{ periodLabel }}</span>
                </span>
                <span class="d-flex align-items-center gap-2">
                    <span class="btn-group btn-group-sm" role="group" aria-label="Forma de la tarjeta" *ngIf="review">
                        <button type="button" class="btn btn-outline-secondary" *ngFor="let v of variants"
                                [ngClass]="{ active: variant === v.id }" [title]="v.help" (click)="setVariant(v.id)">{{ v.label }}</button>
                    </span>
                    <a class="small" [routerLink]="['/assistant']">Ver historial</a>
                </span>
            </div>
            <div class="card-body">
                <!-- Qué pasa con la devolución que falta -->
                <div *ngIf="preparing" class="d-flex align-items-center gap-2 text-body-secondary mb-2">
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Preparando una devolución nueva… la tarjeta se actualiza sola.</span>
                </div>

                <div *ngIf="generating" class="d-flex align-items-center gap-2 text-body-secondary mb-2">
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Generando la devolución de {{ missingLabel }}… puede tardar un par de minutos; si cerrás la página, sigue en el servidor.</span>
                </div>

                <div *ngIf="notice && !preparing && !generating" class="alert alert-light border py-2 mb-2">
                    <div>{{ notice }}</div>
                    <ul class="small mb-1 mt-1" *ngIf="latest?.outlookNotes?.length">
                        <li *ngFor="let n of latest!.outlookNotes">{{ n }}</li>
                    </ul>
                    <button type="button" class="btn btn-outline-primary btn-sm mt-1" (click)="generateNow()">Generar ahora</button>
                </div>

                <div *ngIf="errorMessage" class="mb-2">
                    <div class="text-danger">No se pudo generar la devolución de {{ missingLabel }}.</div>
                    <div class="small text-body-secondary">{{ errorMessage }}</div>
                </div>

                <!-- La devolución -->
                <ng-container *ngIf="review">
                    <h6 class="mb-2">{{ text(review.headline) }}</h6>

                    <!-- Completa y Puntos: los tres puntos a la vista -->
                    <ul class="mb-2" *ngIf="variant !== 'compact'">
                        <li *ngFor="let h of review.highlights">{{ text(h) }}</li>
                    </ul>

                    <!-- Compacta: los tres puntos plegados -->
                    <ng-container *ngIf="variant === 'compact'">
                        <button type="button" class="btn btn-link btn-sm p-0 mb-2" (click)="expanded = !expanded">
                            {{ expanded ? 'Ocultar los puntos' : 'Ver los puntos' }}
                        </button>
                        <ul class="mb-2" *ngIf="expanded">
                            <li *ngFor="let h of review.highlights">{{ text(h) }}</li>
                        </ul>
                    </ng-container>

                    <!-- Hallazgos -->
                    <ng-container *ngIf="findings.length > 0">
                        <ng-container *ngIf="variant === 'points'; else findingsOpen">
                            <button type="button" class="btn btn-link btn-sm p-0 mb-2" (click)="expanded = !expanded">
                                {{ expanded ? 'Ocultar los hallazgos' : 'Hallazgos (' + findings.length + ')' }}
                            </button>
                            <ng-container *ngIf="expanded">
                                <ng-container *ngTemplateOutlet="findingsList; context: { detail: true }"></ng-container>
                            </ng-container>
                        </ng-container>
                        <ng-template #findingsOpen>
                            <div class="small text-body-secondary mb-1"><i class="bi bi-lightbulb me-1"></i>Hallazgos</div>
                            <ng-container *ngTemplateOutlet="findingsList; context: { detail: variant === 'full' }"></ng-container>
                        </ng-template>
                    </ng-container>

                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
                        <span class="small text-warning-emphasis" *ngIf="review.unverifiedFigures.length > 0">
                            <i class="bi bi-exclamation-triangle-fill me-1"></i>Tiene cifras a revisar
                        </span>
                        <span class="small text-body-secondary" *ngIf="review.dataNotes?.length">
                            <i class="bi bi-info-circle me-1"></i>Armada sin: {{ text((review.dataNotes ?? []).join(' ')) }}
                        </span>
                        <a class="btn btn-outline-primary btn-sm ms-auto" [routerLink]="['/assistant']" [queryParams]="{ review: review.id }">Leer completa</a>
                    </div>
                </ng-container>
            </div>
        </div>

        <ng-template #findingsList let-detail="detail">
            <div class="list-group list-group-flush mb-1">
                <div class="list-group-item px-0 py-2" *ngFor="let f of findings">
                    <div>
                        <i class="bi bi-stars me-1"></i>{{ text(f.title) }}
                        <span class="text-body-secondary" *ngIf="detail && f.detail"> — {{ text(f.detail) }}</span>
                    </div>
                    <app-finding-actions [findingId]="f.id" (dismissed)="onFindingDismissed($event)"></app-finding-actions>
                </div>
            </div>
        </ng-template>
    `
})
export class AssistantCardComponent implements OnInit, OnDestroy {
    // El ojo de "ocultar montos" de Inicio: el texto trae los montos escritos y hay que enmascararlos acá.
    @Input() hideAmounts = false;

    state: CardState = 'loading';
    latest: AssistantLatest | null = null;
    review: AssistantReview | null = null;
    findings: AssistantFinding[] = [];

    // Hay una devolución en preparación (de madrugada o a pedido, desde otra pestaña): la tarjeta consulta de nuevo en unos segundos.
    preparing = false;
    // La generación a pedido que disparó esta tarjeta.
    generating = false;
    notice = '';
    missingLabel = '';
    errorMessage = '';

    variants = CARD_VARIANTS;
    variant: CardVariant = 'full';
    expanded = false;

    // Cada cuánto vuelve a preguntar mientras algo se está preparando, y hasta cuándo (unos 5 minutos): pasado eso la pasada se da por
    // interrumpida en el backend y no tiene sentido seguir preguntando.
    static readonly PollMs = 5000;
    static readonly MaxPolls = 60;
    private polls = 0;
    private pollHandle: ReturnType<typeof setTimeout> | null = null;

    constructor(private assistantService: AssistantService) { }

    ngOnInit(): void {
        this.variant = this.readVariant();
        this.assistantService.getStatus().subscribe({
            next: status => {
                if (!status.enabled) {
                    this.state = 'hidden';
                    return;
                }
                this.load();
            },
            error: () => this.state = 'hidden'
        });
    }

    ngOnDestroy(): void {
        if (this.pollHandle) clearTimeout(this.pollHandle);
    }

    get periodLabel(): string {
        return this.review ? reviewPeriodLabel(this.review.kind, this.review.periodStart) : '';
    }

    text(value: string | null | undefined): string {
        return this.hideAmounts ? maskMoney(value) : (value ?? '');
    }

    setVariant(variant: CardVariant): void {
        this.variant = variant;
        this.expanded = false;
        try {
            localStorage.setItem(CARD_VARIANT_STORAGE_KEY, variant);
        } catch { /* sin almacenamiento: la elección vale hasta recargar */ }
    }

    onFindingDismissed(findingId: number): void {
        this.findings = this.findings.filter(f => f.id !== findingId);
    }

    generateNow(): void {
        const missing = this.latest;
        if (!missing?.missingKind) return;
        this.errorMessage = '';
        this.generating = true;
        this.assistantService.generate({ kind: missing.missingKind, periodStart: missing.missingPeriodStart, regenerate: false }).subscribe({
            next: review => {
                this.generating = false;
                if (review.status === 'Failed') {
                    this.errorMessage = review.errorMessage ?? 'Probá de nuevo más tarde.';
                    return;
                }
                this.load();
            },
            error: error => {
                this.generating = false;
                this.errorMessage = error?.error?.message ?? 'Probá de nuevo más tarde.';
            }
        });
    }

    private load(): void {
        this.assistantService.getLatest().subscribe({
            next: latest => this.apply(latest),
            error: () => {
                // Sin lo que había, mejor nada que un mensaje de error en Inicio.
                if (this.state === 'loading') this.state = 'hidden';
            }
        });
    }

    private apply(latest: AssistantLatest): void {
        this.latest = latest;
        this.review = latest.review;
        this.preparing = !!latest.preparing;

        const missing = latest.state === 'NotGenerated' && latest.missingKind ? latest : null;
        this.missingLabel = missing ? reviewPeriodLabel(missing.missingKind!, missing.missingPeriodStart ?? '').toLowerCase() : '';
        this.notice = missing ? this.noticeFor(missing) : '';

        // Una tarjeta vacía no se muestra: solo aparece si hay una devolución, algo en preparación o algo que avisar.
        this.state = this.review || this.preparing || this.notice ? 'visible' : 'hidden';

        if (this.review) this.loadFindings();
        this.schedulePoll();
    }

    private noticeFor(latest: AssistantLatest): string {
        switch (latest.outlook) {
            case 'WaitingForData':
                return `La devolución de ${this.missingLabel} espera a que el mes esté completo. Falta:`;
            case 'LastRunFailed':
                return `La preparación automática de anoche falló y la devolución de ${this.missingLabel} todavía no está.`;
            case 'SchedulerNotRun':
                return `La preparación automática no corrió y la devolución de ${this.missingLabel} todavía no está.`;
            default:
                return `La devolución de ${this.missingLabel} se prepara esta madrugada.`;
        }
    }

    private loadFindings(): void {
        this.assistantService.getFindings(false).subscribe({
            next: findings => this.findings = findings,
            error: () => { /* los hallazgos son un extra: sin ellos, la tarjeta sigue igual */ }
        });
    }

    private schedulePoll(): void {
        if (this.pollHandle) {
            clearTimeout(this.pollHandle);
            this.pollHandle = null;
        }
        if (!this.preparing || this.polls >= AssistantCardComponent.MaxPolls) return;
        this.polls++;
        this.pollHandle = setTimeout(() => this.load(), AssistantCardComponent.PollMs);
    }

    private readVariant(): CardVariant {
        try {
            const stored = localStorage.getItem(CARD_VARIANT_STORAGE_KEY);
            if (stored === 'full' || stored === 'compact' || stored === 'points') return stored;
        } catch { /* ver setVariant */ }
        return 'full';
    }
}
