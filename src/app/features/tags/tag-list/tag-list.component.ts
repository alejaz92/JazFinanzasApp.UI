import { Component, OnInit, ViewChild } from '@angular/core';
import { Tag } from '../models/tag.model';
import { TagService } from '../services/tag.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-tag-list',
    templateUrl: './tag-list.component.html',
    imports: [LoadingComponent, NgIf, NgFor, RouterLink, FormsModule, ConfirmModalComponent]
})
export class TagListComponent implements OnInit {
  isLoading: boolean = true;
  tags: Tag[] | null = null;
  searchTerm: string = '';

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private tagIdToDelete: number | null = null;

  constructor(private tagService: TagService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.tagService.getAllTags().subscribe({
      next: (response) => {
        this.tags = response;
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Error al cargar las etiquetas');
        this.isLoading = false;
      }
    });
  }

  get filteredTags(): Tag[] {
    if (!this.tags) return [];
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.tags;
    return this.tags.filter(t => t.name.toLowerCase().includes(term));
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
        this.load();
      },
      error: () => {
        this.toastService.error('Error al eliminar la etiqueta');
      }
    });

    this.tagIdToDelete = null;
  }
}
