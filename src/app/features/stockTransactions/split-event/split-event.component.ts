import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AssetSplitEvent, AssetSplitEventAdd } from '../models/assetSplitEvent.model';
import { AssetSplitEventService } from '../services/asset-split-event.service';
import { AssetTypeService } from '../../assetType/services/asset-type.service';
import { AssetService } from '../../asset/services/asset.service';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf, DatePipe } from '@angular/common';

@Component({
    selector: 'app-split-event',
    templateUrl: './split-event.component.html',
    styleUrls: ['./split-event.component.css'],
    imports: [RouterLink, FormsModule, NgFor, NgIf, ReactiveFormsModule, DatePipe]
})
export class SplitEventComponent implements OnInit {
  splitForm!: FormGroup;
  assetTypes: any[] = [];
  assets: any[] = [];
  splits: AssetSplitEvent[] = [];
  selectedAssetTypeId: string = '';
  selectedAssetId: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  isLoadingSplits: boolean = false;

  constructor(
    private fb: FormBuilder,
    private splitEventService: AssetSplitEventService,
    private assetTypeService: AssetTypeService,
    private assetService: AssetService
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
      this.errorMessage = 'El ratio no puede ser 1 (no produce ningún efecto).';
      return;
    }

    const dto: AssetSplitEventAdd = {
      assetId: parseInt(this.selectedAssetId),
      date: this.splitForm.value.date,
      splitRatio: parseFloat(this.splitForm.value.splitRatio)
    };

    this.splitEventService.add(dto).subscribe({
      next: () => {
        this.successMessage = 'Split registrado correctamente.';
        this.errorMessage = '';
        this.splitForm.reset();
        this.loadSplits();
        setTimeout(() => { this.successMessage = ''; }, 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Error al registrar el split.';
      }
    });
  }

  onDelete(split: AssetSplitEvent) {
    const dateStr = new Date(split.date).toLocaleDateString('es-AR');
    if (!confirm(`¿Eliminar el split ${split.splitRatio}:1 del ${dateStr}?`)) return;
    this.splitEventService.delete(split.id).subscribe(() => {
      this.loadSplits();
    });
  }
}
