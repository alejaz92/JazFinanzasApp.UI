import { Component, OnInit } from '@angular/core';
import { AssetType } from '../models/assetType.model';
import { AccountService } from '../services/account.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-account-assettype',
  templateUrl: './account-assettype.component.html',
  styleUrls: ['./account-assettype.component.css']
})
export class AccountAssetTypeComponent  implements OnInit {
  isLoading: boolean = true;
  assetTypes: AssetType[] = [];
  accountName: string = '';
  accountId!: number;;

  constructor(private accountService: AccountService, private route:ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.accountId = +params['id'];

      // get the account name
      this.accountService.getAccountById(this.accountId).subscribe((data) => {
        this.accountName = data.name;
      });

      this.getAssetTypes();
    });
  }

  getAssetTypes(): void {
    this.accountService.getAccountAssetTypes(this.accountId).subscribe((data) => {
      this.assetTypes = data;
      this.isLoading = false;
    });
  }

  updateAssetTypes(): void {
    this.accountService.updateAccountAssetTypes(this.accountId, this.assetTypes).subscribe(() => {
      alert('Los tipos de activos han sido actualizados exitosamente.');
    });
  } 

 
}
