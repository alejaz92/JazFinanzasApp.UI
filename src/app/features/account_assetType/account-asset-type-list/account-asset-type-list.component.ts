import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { AccountAssetTypeService } from './services/accountassettype.service';

@Component({
  selector: 'app-account-asset-type-list',
  templateUrl: './account-asset-type-list.component.html',
  styleUrls: ['./account-asset-type-list.component.css']
})
export class AccountAssetTypeListComponent implements OnInit {
  accountAssetTypesForm: FormGroup;
  accountId: number | undefined;

  constructor(private fb: FormBuilder, 
    private accountAssetTypeService: AccountAssetTypeService) { 
      this.accountAssetTypesForm = this.fb.group({
        assetTypes: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadAssetTypes();
  }

  loadAssetTypes() {
    this.accountAssetTypeService.getAssetTypes(this.accountId).subscribe(assetTypes => {
      const assetTypesArray = this.accountAssetTypesForm.get('assetTypes') as FormArray;
      assetTypesArray.clear();

      assetTypes.forEach(asset => {
        assetTypesArray.push(this.fb.group({
          id: [asset.assetTypeId],
          name: [asset.assetTypeName],
          isSelected: [asset.isSelected]
        }));
      });
    });
  }

}
