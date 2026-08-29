import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Tag } from '../../../features/tags/models/tag.model';
import { TagService } from '../../../features/tags/services/tag.service';

// Selector de etiquetas para alta/edición de movimiento y de consumo de tarjeta (Fase 9,
// docs/plans/activos/plan-rediseno-reportes.md). No persiste nada por su cuenta — solo lleva
// qué etiquetas están tildadas ([(selectedTagIds)]); es el formulario contenedor el que decide
// cuándo y cómo asignar/desasignar, igual que ya hace transaction-add con el gasto compartido.
@Component({
    selector: 'app-tag-picker',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <div class="tag-picker">
            @if (tags.length > 0) {
                <div class="d-flex flex-wrap gap-2">
                    @for (tag of tags; track tag.id) {
                        <button type="button"
                                class="btn btn-sm tag-picker-pill"
                                [class.tag-picker-pill-selected]="isSelected(tag.id)"
                                [style.--tag-color]="tag.color || '#8B72E8'"
                                (click)="toggle(tag.id)">
                            {{ tag.name }}
                        </button>
                    }
                </div>
            } @else {
                <small class="text-muted">
                    No tenés etiquetas creadas todavía —
                    <a [routerLink]="['/management/tags/add']">creá una</a>.
                </small>
            }
        </div>
    `,
    styles: [`
        .tag-picker-pill {
            border: 1px solid var(--tag-color, #8B72E8);
            color: var(--tag-color, #8B72E8);
            background: transparent;
        }
        .tag-picker-pill:hover {
            background: color-mix(in srgb, var(--tag-color, #8B72E8) 12%, transparent);
        }
        .tag-picker-pill-selected {
            background: var(--tag-color, #8B72E8);
            color: #fff;
        }
    `]
})
export class TagPickerComponent implements OnInit {
    @Input() selectedTagIds: number[] = [];
    @Output() selectedTagIdsChange = new EventEmitter<number[]>();

    tags: Tag[] = [];

    constructor(private tagService: TagService) {}

    ngOnInit(): void {
        this.tagService.getAllTags().subscribe(tags => this.tags = tags);
    }

    isSelected(tagId: number): boolean {
        return this.selectedTagIds.includes(tagId);
    }

    toggle(tagId: number): void {
        const next = this.isSelected(tagId)
            ? this.selectedTagIds.filter(id => id !== tagId)
            : [...this.selectedTagIds, tagId];
        this.selectedTagIds = next;
        this.selectedTagIdsChange.emit(next);
    }
}
