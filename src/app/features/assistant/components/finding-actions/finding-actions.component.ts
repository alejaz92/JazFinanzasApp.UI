import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AssistantService } from '../../services/assistant.service';
import { ToastService } from '../../../../core/services/toast.service';

// Los botones de un hallazgo del asistente dentro de la bandeja de pendientes (plan-devoluciones-llm.md, D8b y
// Fase 12): calificarlo como útil o no útil y descartarlo, sin entrar a la pantalla del asistente. Lo usan Inicio y
// Panorama, que dibujan la misma bandeja. Al descartar avisa con `dismissed` para que la pantalla lo saque de la lista.
@Component({
    selector: 'app-finding-actions',
    standalone: true,
    imports: [NgClass, RouterLink],
    template: `
        <div class="d-flex align-items-center gap-1 flex-wrap mt-1">
            <button type="button" class="btn btn-sm py-0" [ngClass]="rating === 1 ? 'btn-success' : 'btn-outline-success'"
                    [disabled]="busy" (click)="rate(1)" title="Útil">
                <i class="bi bi-hand-thumbs-up"></i>
            </button>
            <button type="button" class="btn btn-sm py-0" [ngClass]="rating === -1 ? 'btn-danger' : 'btn-outline-danger'"
                    [disabled]="busy" (click)="rate(-1)" title="No útil">
                <i class="bi bi-hand-thumbs-down"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary py-0" [disabled]="busy" (click)="dismiss()">
                Descartar
            </button>
            <a class="small ms-1" [routerLink]="['/assistant']" [queryParams]="{ tab: 'findings' }">Ver todos</a>
        </div>
    `
})
export class FindingActionsComponent {
    @Input({ required: true }) findingId!: number;
    @Output() dismissed = new EventEmitter<number>();

    // La bandeja no trae la calificación previa: arranca sin marcar y refleja lo que se toca acá.
    rating: number | null = null;
    busy = false;

    constructor(private assistantService: AssistantService, private toastService: ToastService) { }

    rate(rating: number): void {
        // El backend no tiene "sin calificar": tocar de nuevo la misma nota no hace nada.
        if (this.busy || this.rating === rating) return;
        this.busy = true;
        this.assistantService.updateFinding(this.findingId, { rating }).subscribe({
            next: () => {
                this.busy = false;
                this.rating = rating;
            },
            error: error => {
                this.busy = false;
                this.toastService.error(error?.error?.message ?? 'No se pudo calificar el hallazgo.');
            }
        });
    }

    dismiss(): void {
        if (this.busy) return;
        this.busy = true;
        this.assistantService.updateFinding(this.findingId, { dismiss: true }).subscribe({
            next: () => {
                this.busy = false;
                this.dismissed.emit(this.findingId);
            },
            error: error => {
                this.busy = false;
                this.toastService.error(error?.error?.message ?? 'No se pudo descartar el hallazgo.');
            }
        });
    }
}
