import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TagService } from '../services/tag.service';
import { TagAddRequest } from '../models/tag-addRequest.model';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';

@Component({
    selector: 'app-tag-add',
    templateUrl: './tag-add.component.html',
    styleUrls: ['./tag-add.component.css'],
    imports: [FormsModule, BackButtonComponent, SubmitButtonComponent]
})
export class TagAddComponent {
  model: TagAddRequest = { name: '', color: '#0d6efd' };
  isSubmitting = false;
  private addTagSubscription?: Subscription;

  constructor(
    private tagService: TagService,
    private router: Router,
    private toastService: ToastService
  ) { }

  onFormSubmit() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.addTagSubscription = this.tagService.addTag(this.model).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success('Etiqueta creada correctamente');
        this.router.navigate(['/management/tag']);
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.error === 'Tag already exists') {
          this.toastService.error('Ya existe una etiqueta con ese nombre');
        } else {
          this.toastService.error('Error al crear la etiqueta');
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.addTagSubscription?.unsubscribe();
  }
}
