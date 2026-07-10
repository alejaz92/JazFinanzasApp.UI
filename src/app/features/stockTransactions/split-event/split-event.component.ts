import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AssetSplitEvent, AssetSplitEventAdd } from '../models/assetSplitEvent.model';
import { AssetSplitEventService } from '../services/asset-split-event.service';
import { AssetTypeService } from '../../assetType/services/asset-type.service';
import { AssetService } from '../../asset/services/asset.service';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-split-event',
    templateUrl: './split-event.component.html',
    styleUrls: ['./split-event.component.css'],
    imports: [FormsModule, NgFor, NgIf, ReactiveFormsModule, DatePipe, BackButtonComponent, ConfirmModalComponent]
})
export class SplitEventComponent implements OnInit {
  splitForm!: FormGroup;
  assetTypes: any[] = [];
  assets: any[] = [];
  splits: AssetSplitEvent[] = [];
  selectedAssetTypeId: string = '';
  selectedAssetId: string = '';
  isLoadingSplits: boolean = false;

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  deleteModalMessage: string = '';
  private splitToDelete: AssetSplitEvent | null = null;

  constructor(
    private fb: FormBuilder,
    private splitEventService: AssetSplitEventService,
    private assetTypeService: AssetTypeService,
    private assetService: AssetService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.splitForm = this.fb.group({
      date: ['', Validators.required],
      splitRatio: ['', [Validators.required, Validators.min(0.0001)]]
    });

    this.assetTypeService.getAssetTypes('Bolsa').subscribe((data: any) => {
      this.assetTypes = data;
    });
  }

  onAssetTypeChange(event: any) {
    this.selectedAssetTypeId = event.target.value;
    this.assets = [];
    this.splits = [];
    this.selectedAssetId = '';

    if (this.selectedAssetTypeId) {
      this.assetService.getAssignedAssets(Number(this.selectedAssetTypeId)).subscribe((data: any) => {
        this.assets = data;
      });
    }
  }

  onAssetChange(event: any) {
    this.selectedAssetId = event.target.value;
    if (this.selectedAssetId) {
      this.loadSplits();
    } else {
      this.splits = [];
    }
  }

  loadSplits() {
    this.isLoadingSplits = true;
    this.splitEventService.getByAssetId(Number(this.selectedAssetId)).subscribe(data => {
      this.splits = data;
      this.isLoadingSplits = false;
    });
  }

  get splitRatioValue(): number {
    return parseFloat(this.splitForm.get('splitRatio')?.value) || 0;
  }

  get splitInterpretation(): string {
    const ratio = this.splitRatioValue;
    if (!ratio || ratio <= 0 || ratio === 1) return '';
    if (ratio > 1) return `Cada acción se convierte en ${ratio} acciones (split ${ratio}:1)`;
    const inverse = (1 / ratio).toFixed(0);
    return `Cada ${inverse} acciones se convierten en 1 acción (reverse split ${inverse}:1)`;
  }

  onSubmit() {
    if (this.splitForm.invalid || !this.selectedAssetId) return;

    if (this.splitRatioValue === 1) {
      this.toastService.error('El ratio no puede ser 1 (no produce ningún efecto).');
      return;
    }

    const dto: AssetSplitEventAdd = {
      assetId: parseInt(this.selectedAssetId),
      date: this.splitForm.value.date,
      splitRatio: parseFloat(this.splitForm.value.splitRatio)
    };

    this.splitEventService.add(dto).subscribe({
      next: () => {
        this.toastService.success('Split registrado correctamente.');
        this.splitForm.reset();
        this.loadSplits();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Error al registrar el split.');
      }
    });
  }

  onDelete(split: AssetSplitEvent) {
    const dateStr = new Date(split.date).toLocaleDateString('es-AR');
    this.splitToDelete = split;
    this.deleteModalMessage = `¿Eliminar el split ${split.splitRatio}:1 del ${dateStr}?`;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.splitToDelete) return;

    this.splitEventService.delete(this.splitToDelete.id).subscribe({
      next: () => {
        this.toastService.success('Split eliminado correctamente');
        this.loadSplits();
      },
      error: () => {
        this.toastService.error('Error al eliminar el split');
      }
    });

    this.splitToDelete = null;
  }
}
