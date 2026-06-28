import { Component, Input, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" [class]="btnClass" (click)="goBack()">
      <i *ngIf="showIcon" class="bi bi-arrow-left me-1"></i>{{ label }}
    </button>
  `
})
export class BackButtonComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  /** Texto del botón */
  @Input() label = 'Volver';
  /** Clases CSS (Bootstrap por defecto) */
  @Input() btnClass = 'btn btn-outline-secondary';
  /** Query param a priorizar (ej: ?returnTo=/ruta) */
  @Input() queryParamKey = 'returnTo';
  /** Clave en history.state a priorizar si no hay query param */
  @Input() stateKey = 'returnUrl';
  /** Fallback si no hay historial ni hints previos */
  @Input() defaultUrl: string | any[] = ['/'];

  @Input() showIcon = true;

  goBack(): void {
    const qp = this.route.snapshot.queryParamMap.get(this.queryParamKey);
    if (qp) { this.router.navigateByUrl(qp); return; }

    const st = (history.state ?? {}) as Record<string, any>;
    const stUrl = st[this.stateKey];
    if (stUrl) { this.router.navigateByUrl(stUrl); return; }

    if (window.history.length > 1) { this.location.back(); return; }

    if (Array.isArray(this.defaultUrl)) this.router.navigate(this.defaultUrl);
    else if (typeof this.defaultUrl === 'string') this.router.navigateByUrl(this.defaultUrl);
    else this.router.navigate(['/']);
  }
}
