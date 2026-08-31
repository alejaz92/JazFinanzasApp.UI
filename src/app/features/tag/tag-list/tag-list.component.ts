import { Component, OnInit, ViewChild } from '@angular/core';
import { TagService } from '../services/tag.service';
import { Tag } from '../models/tag.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-tag-list',
    templateUrl: './tag-list.component.html',
    styleUrls: ['./tag-list.component.css'],
    imports: [LoadingComponent, NgIf, NgFor, RouterLink, ConfirmModalComponent]
})
export class TagListComponent implements OnInit {
  isLoading = true;
  tags: Tag[] | null = null;

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private tagIdToDelete: number | null = null;

  constructor(private tagService: TagService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.tagService.getAllTags().subscribe((data) => {
      this.tags = data;
      this.isLoading = false;
    });
  }

  onDelete(tagId: number): void {
    this.tagIdToDelete = tagId;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.tagIdToDelete) return;

    this.tagService.deleteTag(this.tagIdToDelete).subscribe({
      next: () => {
        this.toastService.success('Etiqueta eliminada correctamente');
        this.loadTags();
      },
      error: () => {
        this.toastService.error('Error al eliminar la etiqueta');
      }
    });

    this.tagIdToDelete = null;
  }
}
