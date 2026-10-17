import { Component, Input } from '@angular/core';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { MarkdownBlock, MarkdownSegment, parseMarkdown } from '../../utils/assistant.util';

// Muestra el cuerpo de una devolución (markdown) sin usar innerHTML: parseMarkdown devuelve datos y acá se pintan
// con interpolación, así que cualquier etiqueta HTML que el modelo escriba se ve como texto y no se ejecuta.
@Component({
    selector: 'app-assistant-markdown',
    standalone: true,
    imports: [NgFor, NgIf, NgTemplateOutlet],
    template: `
        <ng-template #inline let-segments>
            <ng-container *ngFor="let s of segments">
                <strong *ngIf="s.bold">{{ s.text }}</strong>
                <em *ngIf="!s.bold && s.italic">{{ s.text }}</em>
                <ng-container *ngIf="!s.bold && !s.italic">{{ s.text }}</ng-container>
            </ng-container>
        </ng-template>

        <ng-container *ngFor="let block of blocks">
            <p *ngIf="block.type === 'paragraph'">
                <ng-container *ngTemplateOutlet="inline; context: { $implicit: asParagraph(block).segments }"></ng-container>
            </p>
            <ul *ngIf="block.type === 'list' && !asList(block).ordered">
                <li *ngFor="let item of asList(block).items">
                    <ng-container *ngTemplateOutlet="inline; context: { $implicit: item }"></ng-container>
                </li>
            </ul>
            <ol *ngIf="block.type === 'list' && asList(block).ordered">
                <li *ngFor="let item of asList(block).items">
                    <ng-container *ngTemplateOutlet="inline; context: { $implicit: item }"></ng-container>
                </li>
            </ol>
        </ng-container>
    `
})
export class AssistantMarkdownComponent {
    blocks: MarkdownBlock[] = [];

    @Input() set text(value: string | null | undefined) {
        this.blocks = parseMarkdown(value);
    }

    asParagraph(block: MarkdownBlock): { segments: MarkdownSegment[] } {
        return block as { type: 'paragraph'; segments: MarkdownSegment[] };
    }

    asList(block: MarkdownBlock): { ordered: boolean; items: MarkdownSegment[][] } {
        return block as { type: 'list'; ordered: boolean; items: MarkdownSegment[][] };
    }
}
