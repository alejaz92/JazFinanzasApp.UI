import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const bootstrap: any;

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Está seguro que desea continuar?';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('modalRef') modalRef!: ElementRef;
  private modalInstance: any;

  open(): void {
    const el = this.modalRef?.nativeElement as HTMLElement | null;
    if (!el) return;
    this.modalInstance = new bootstrap.Modal(el);
    this.modalInstance.show();
  }

  close(): void {
    this.modalInstance?.hide();
  }

  onConfirm(): void {
    this.close();
    this.confirmed.emit();
  }

  onCancel(): void {
    this.close();
    this.cancelled.emit();
  }
}
