import { Component, Input, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AssistantService } from '../../services/assistant.service';
import { AssistantLatest, AssistantReview } from '../../models/assistant.model';
import { maskMoney, reviewPeriodLabel } from '../../utils/assistant.util';

type CardState = 'loading' | 'ready' | 'generating' | 'failed' | 'hidden';

// Tarjeta del asistente en Inicio (plan-devoluciones-llm.md, Fase 12): el titular y los tres puntos de la última
// devolución, con "Leer completa". Es también quien dispara la generación (D6): si el backend dice que falta una
// devolución, la pide y muestra "Generando…"; y si toca la revisión semanal, la dispara en segundo plano y sin
// indicador, porque sus hallazgos aparecen en la bandeja la próxima vez que se carga Inicio.
//
// Si el asistente no está habilitado para el usuario, o cualquier consulta falla, la tarjeta no aparece: Inicio no
// tiene que mostrar errores ni un hueco por algo que es un extra.
@Component({
    selector: 'app-assistant-card',
    standalone: true,
    imports: [NgIf, NgFor, RouterLink],
    template: `
        <div class="card mb-3" *ngIf="state !== 'hidden' && state !== 'loading'">
            <div class="card-header d-flex justify-content-between align-items-center gap-2">
                <span>
                    <i class="bi bi-stars me-1"></i>Asistente
                    <span class="text-body-secondary" *ngIf="review && state === 'ready'"> — {{ periodLabel }}</span>
                </span>
                <a class="small" [routerLink]="['/assistant']">Ver historial</a>
            </div>
            <div class="card-body">
                <div *ngIf="state === 'generating'" class="d-flex align-items-center gap-2 text-body-secondary">
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Generando la devolución de {{ generatingLabel }}… puede tardar alrededor de 30 segundos.</span>
                </div>

                <div *ngIf="state === 'failed'">
                    <div class="text-danger">No se pudo generar la devolución de {{ generatingLabel }}.</div>
                    <div class="small text-body-secondary">{{ errorMessage }}</div>
                </div>

                <ng-container *ngIf="state === 'ready' && review">
                    <h6 class="mb-2">{{ text(review.headline) }}</h6>
                    <ul class="mb-2">
                        <li *ngFor="let h of review.highlights">{{ text(h) }}</li>
                    </ul>
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <span class="small text-warning-emphasis" *ngIf="review.unverifiedFigures.length > 0">
                            <i class="bi bi-exclamation-triangle-fill me-1"></i>Tiene cifras a revisar
                        </span>
                        <a class="btn btn-outline-primary btn-sm ms-auto" [routerLink]="['/assistant']" [queryParams]="{ review: review.id }">Leer completa</a>
                    </div>
                </ng-container>
            </div>
        </div>
    `
})
export class AssistantCardComponent implements OnInit {
    // El ojo de "ocultar montos" de Inicio: el texto trae los montos escritos y hay que enmascararlos acá.
    @Input() hideAmounts = false;

    state: CardState = 'loading';
    review: AssistantReview | null = null;
    generatingLabel = '';
    errorMessage = '';

    // Cuántas devoluciones seguidas se generan como máximo en una visita: el cierre del mes y, desde el día 15, la
    // de mitad de mes. Es un tope contra un bucle si el backend siguiera diciendo "falta" sin que se genere nada.
    private static readonly MaxGenerations = 3;

    constructor(private assistantService: AssistantService) { }

    ngOnInit(): void {
        this.assistantService.getStatus().subscribe({
            next: status => {
                if (!status.enabled) {
                    this.state = 'hidden';
                    return;
                }
                this.refresh(0);
            },
            error: () => this.state = 'hidden'
        });
    }

    get periodLabel(): string {
        return this.review ? reviewPeriodLabel(this.review.kind, this.review.periodStart) : '';
    }

    text(value: string | null): string {
        return this.hideAmounts ? maskMoney(value) : (value ?? '');
    }

    private refresh(generated: number): void {
        this.assistantService.getLatest().subscribe({
            next: latest => this.apply(latest, generated),
            error: () => {
                // Sin lo que había, mejor nada que un mensaje de error en Inicio.
                if (this.state === 'loading' || this.state === 'generating') this.state = this.review ? 'ready' : 'hidden';
            }
        });
    }

    private apply(latest: AssistantLatest, generated: number): void {
        if (latest.state === 'NotGenerated' && latest.missingKind && generated < AssistantCardComponent.MaxGenerations) {
            this.generate(latest, generated);
            return;
        }

        if (latest.review) {
            this.review = latest.review;
            this.state = 'ready';
        } else if (this.state !== 'failed') {
            this.state = 'hidden';
        }

        // D6, paso 3: la revisión semanal va en segundo plano, sin indicador y sin molestar si falla.
        if (latest.weeklyScanDue) {
            this.assistantService.generate({ kind: 'WeeklyScan', regenerate: false }).subscribe({ error: () => { } });
        }
    }

    private generate(latest: AssistantLatest, generated: number): void {
        this.generatingLabel = reviewPeriodLabel(latest.missingKind!, latest.missingPeriodStart ?? '').toLowerCase();
        this.state = 'generating';

        this.assistantService.generate({
            kind: latest.missingKind!,
            periodStart: latest.missingPeriodStart,
            regenerate: false
        }).subscribe({
            next: review => {
                if (review.status === 'Failed') {
                    this.fail(review.errorMessage);
                    return;
                }
                // Generada (o sin movimientos): se vuelve a preguntar, por si falta otra (el cierre y la mitad de mes).
                this.refresh(generated + 1);
            },
            error: error => this.fail(error?.error?.message)
        });
    }

    private fail(message: string | null | undefined): void {
        this.errorMessage = message ?? 'Probá de nuevo más tarde.';
        this.state = 'failed';
    }
}
