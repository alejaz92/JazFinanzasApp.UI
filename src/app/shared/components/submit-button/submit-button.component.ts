import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-submit-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button [type]="type" [class]="btnClass" [disabled]="disabled || loading">
      <span *ngIf="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
      {{ loading ? loadingLabel : label }}
    </button>
  `
})
export class SubmitButtonComponent {
  /** Texto del botón en estado normal */
  @Input() label = 'Guardar';
  /** Texto mostrado junto al spinner mientras loading es true */
  @Input() loadingLabel = 'Guardando...';
  /** Deshabilita el botón y muestra el spinner mientras la request está en curso */
  @Input() loading = false;
  /** Condición adicional de deshabilitado (ej. validez del formulario) */
  @Input() disabled = false;
  /** Clases CSS (Bootstrap por defecto) */
  @Input() btnClass = 'btn btn-primary m-1';
  @Input() type: 'submit' | 'button' = 'submit';
}
