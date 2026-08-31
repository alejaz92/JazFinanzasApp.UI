import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TagService } from '../services/tag.service';
import { Tag } from '../models/tag.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';

@Component({
    selector: 'app-tag-edit',
    templateUrl: './tag-edit.component.html',
    styleUrls: ['./tag-edit.component.css'],
    imports: [FormsModule, NgIf, LoadingComponent, BackButtonComponent, SubmitButtonComponent]
})
export class TagEditComponent implements OnInit, OnDestroy {
  isLoading = true;
  isSubmitting = false;
  id!: number;
  tag?: Tag;
  private paramsSubscription?: Subscription;
  private updateTagSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private tagService: TagService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.paramsSubscription = this.route.paramMap.subscribe((params) => {
      this.id = Number(params.get('id'));
      this.tagService.getTagById(this.id).subscribe({
        next: (data) => {
          this.tag = data;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
    });
  }

  onFormSubmit(): void {
    if (this.isSubmitting || !this.tag) return;
    this.isSubmitting = true;

    this.updateTagSubscription = this.tagService.updateTag(this.id, { name: this.tag.name, color: this.tag.color }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success('Etiqueta actualizada correctamente');
        this.router.navigate(['/management/tag']);
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.error === 'Tag already exists') {
          this.toastService.error('Ya existe una etiqueta con ese nombre');
        } else {
          this.toastService.error('Error al actualizar la etiqueta');
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.updateTagSubscription?.unsubscribe();
  }
}
