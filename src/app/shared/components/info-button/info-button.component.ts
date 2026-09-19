import { Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';

declare const bootstrap: any;

// Ayuda contextual (Bloque G del plan de rediseño de Reportes, sección 7): un botón chico junto a un
// gráfico o tabla que abre un modal explicando qué muestra, de dónde salen los datos y cómo leerlo.
// Texto simple por `text`, o contenido propio (lista, tabla corta) por proyección con <ng-content>.
@Component({
    selector: 'app-info-button',
    standalone: true,
    imports: [NgIf],
    templateUrl: './info-button.component.html',
    styleUrl: './info-button.component.scss'
})
export class InfoButtonComponent implements OnDestroy {
    @Input({ required: true }) title!: string;
    @Input() text?: string;

    @ViewChild('modalRef') modalRef!: ElementRef<HTMLElement>;
    private modalInstance: any;
    private movedToBody = false;

    open(event?: Event): void {
        // Muchos encabezados viven dentro de una tarjeta que es un link (Panorama): el clic del botón
        // no tiene que navegar.
        event?.preventDefault();
        event?.stopPropagation();
        const el = this.modalRef?.nativeElement;
        if (!el) return;
        // Se lleva el modal al <body>: dentro de un card-header o de un contenedor con transform el
        // backdrop de Bootstrap puede quedar por encima del diálogo o recortado.
        if (!this.movedToBody) {
            document.body.appendChild(el);
            this.movedToBody = true;
        }
        this.modalInstance = bootstrap.Modal.getOrCreateInstance(el);
        this.modalInstance.show();
    }

    ngOnDestroy(): void {
        this.modalInstance?.dispose();
        if (this.movedToBody) this.modalRef?.nativeElement.remove();
    }
}
