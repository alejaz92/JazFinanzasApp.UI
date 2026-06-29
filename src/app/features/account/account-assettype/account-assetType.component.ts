import { Component, OnInit } from '@angular/core';
import { AssetType } from '../models/assetType.model';
import { AccountService } from '../services/account.service';
import { ActivatedRoute } from '@angular/router';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-account-assettype',
    templateUrl: './account-assettype.component.html',
    styleUrls: ['./account-assettype.component.css'],
    imports: [LoadingComponent, NgIf, NgFor, NgClass, BackButtonComponent]
})
export class AccountAssetTypeComponent  implements OnInit {
  isLoading: boolean = true;
  assetTypes: AssetType[] = [];
  accountName: string = '';
  accountId!: number;;

  constructor(private accountService: AccountService, private route: ActivatedRoute, private toastService: ToastService) { }

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
    this.accountService.updateAccountAssetTypes(this.accountId, this.assetTypes).subscribe({
      next: () => {
        this.toastService.success('Los tipos de activos han sido actualizados exitosamente.');
      },
      error: () => {
        this.toastService.error('Error al actualizar los tipos de activos.');
      }
    });
  }

 
}
