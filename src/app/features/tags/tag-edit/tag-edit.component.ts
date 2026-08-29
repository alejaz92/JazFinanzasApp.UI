import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Tag } from '../models/tag.model';
import { TagAddRequest } from '../models/tag-add-request.model';
import { TagService } from '../services/tag.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';

@Component({
    selector: 'app-tag-edit',
    templateUrl: './tag-edit.component.html',
    imports: [LoadingComponent, NgIf, FormsModule, BackButtonComponent, SubmitButtonComponent]
})
export class TagEditComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  id: string | null = null;
  tag?: Tag;
  private paramsSubscription?: Subscription;
  private editSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private tagService: TagService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.paramsSubscription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');
        if (this.id) {
          // No hay GET /api/tag/{id}: la lista de etiquetas de un usuario es chica, así que se
          // busca en la lista completa en vez de sumar un endpoint solo para esto.
          this.tagService.getAllTags().subscribe({
            next: (tags) => {
              this.tag = tags.find(t => t.id === Number(this.id));
              this.isLoading = false;
            },
            error: () => {
              this.toastService.error('Error al cargar la etiqueta');
              this.isLoading = false;
            }
          });
        }
      }
    });
  }

  onFormSubmit(): void {
    if (!this.id || !this.tag || this.isSubmitting) return;

    this.isSubmitting = true;
    const request: TagAddRequest = { name: this.tag.name, color: this.tag.color };

    this.editSubscription = this.tagService.updateTag(Number(this.id), request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success('Etiqueta actualizada correctamente');
        this.router.navigate(['/management/tags']);
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.error('Error al actualizar la etiqueta');
      }
    });
  }

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.editSubscription?.unsubscribe();
  }
}
