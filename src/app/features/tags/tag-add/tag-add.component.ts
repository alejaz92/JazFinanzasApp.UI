import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TagAddRequest } from '../models/tag-add-request.model';
import { TagService } from '../services/tag.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';

@Component({
    selector: 'app-tag-add',
    templateUrl: './tag-add.component.html',
    imports: [FormsModule, BackButtonComponent, SubmitButtonComponent]
})
export class TagAddComponent implements OnDestroy {
  model: TagAddRequest;
  isSubmitting = false;
  private addSubscription?: Subscription;

  constructor(
    private tagService: TagService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.model = { name: '', color: '#5B3DD9' };
  }

  onFormSubmit(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.addSubscription = this.tagService.createTag(this.model).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success('Etiqueta creada correctamente');
        this.router.navigate(['/management/tags']);
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.error('Error al crear la etiqueta');
      }
    });
  }

  ngOnDestroy(): void {
    this.addSubscription?.unsubscribe();
  }
}
