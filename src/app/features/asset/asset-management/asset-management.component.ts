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
    this.assetService.checkAssetUsage(asset.id).subscribe(canUnassign => {
      if (canUnassign) {
        this.assetService.unassignAsset(asset.id).subscribe(response => {
          this.availableAssets.push(asset);
          this.assignedAssets = this.assignedAssets.filter(a => a.id !== asset.id);
        });
      } else {
        alert('Asset is in use and cannot be unassigned');
      }
    });

  }

}
