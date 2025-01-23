import { Component, OnInit } from '@angular/core';
import { Asset } from '../models/asset.model';
import { AssetService } from '../services/asset.service';

@Component({
  selector: 'app-asset-management',
  templateUrl: './asset-management.component.html',
  styleUrls: ['./asset-management.component.css']
})
export class AssetManagementComponent implements OnInit {
  isLoading: boolean = true;
  assetTypes: any[] = [];
  selectedAssetType: number = 0;
  availableAssets: Asset[] = [];
  assignedAssets: Asset[] = [];

  constructor(private assetService: AssetService) { }

  ngOnInit(): void {
    this.assetService.getAssetTypes().subscribe(types => {
      this.assetTypes = types;
      this.isLoading = false;
    });


    //this.loadAssignedAssets();
  }



  onAssetTypeChange() {

    this.assignedAssets = [];
    this.availableAssets = [];

    this.assetService.getAvailableAssets(this.selectedAssetType).subscribe(available => {

      

      this.assetService.getAssignedAssets(this.selectedAssetType).subscribe(used => {

        
        this.availableAssets = available.filter(a => !used.some(u => u.id === a.id));
        this.assignedAssets = used;
      });

    });
  }

  assignAsset(asset: Asset) {
    this.assetService.assignAsset(asset.id).subscribe(response => {
      this.assignedAssets.push(asset);
      this.availableAssets = this.availableAssets.filter(a => a.id !== asset.id);

    });

    
  }

  unassignAsset(asset: Asset) {
      this.assetService.unassignAsset(asset.id).subscribe(response => {
        this.availableAssets.push(asset);
        this.assignedAssets = this.assignedAssets.filter(a => a.id !== asset.id);
      },
        error => {
          if (error.error === 'Asset is used in transactions') {
            alert('No se puede desasignar un activo que está siendo utilizado en una transacción');
          } else {
            alert(error.error);
          }
          
        }
    );
  }

  onReferenceChange(asset: Asset) {

    
    this.assetService.updateReference(asset).subscribe(
      response => {
        console.log(response)
        if (asset.isReference == false) {
          asset.isMainReference = false;
        }
      },
      error => {

        if (error.error === 'Only 3 reference assets allowed') {
          alert('No puede elegir más de 3 activos de referencia');

          //update de checkbox
          asset.isReference = false;
        }
      }
    );
  }

  onMainReferenceChange(asset: Asset) {
    if (asset.isMainReference == true) {
      this.assignedAssets.forEach(a => {
        if (a.id !== asset.id) {
          a.isMainReference = false;
        }
      });
    }
    this.assetService.updateMainReference(asset).subscribe(
      response => {
       console.log(response);
      },
      error => {
        if (error.error === 'Only 1 main reference asset allowed') {
          alert('No puede elegir más de 1 activo de referencia principal');

          //update de checkbox
          asset.isMainReference = false;
        }
      }
    );
  }


}
