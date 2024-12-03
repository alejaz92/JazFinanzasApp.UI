import { Component, OnInit } from '@angular/core';
import { ReportService } from '../services/report.service';
import { AssetService } from '../../asset/services/asset.service';
import { AssetTypeService } from '../../assetType/services/asset-type.service';
import { Balance } from '../models/Balance.modelt';
import { TotalBalance } from '../models/TotalBalance.model';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.css']
})
export class BalanceComponent implements OnInit {
  totalBalance: TotalBalance[] = [];
  pesosBalance: number = 0;
  dollarBalance: number = 0;
  balances: Balance[] = [];
  assetTypes: any[] = [];
  selectedAssetType: any = "0";
  assets: any[] = [];
  selectedAsset: any = "0";

  constructor(
    private reportService: ReportService,
    private assetService: AssetService,
  ) { }

  ngOnInit(): void {
    this.loadTotalBalance();
    this.loadAssetTypes();
  }

  loadTotalBalance() {
    this.reportService.getTotalBalance()
      .subscribe(response => {
        this.totalBalance = response;

        this.pesosBalance = this.totalBalance.find(b => b.asset === 'Pesos')?.balance || 0;
        this.dollarBalance = this.totalBalance.find(b => b.asset === 'Dólares')?.balance || 0;
      });
  }


  loadAssetTypes() {
    this.assetService.getAssetTypes()
      .subscribe(response => {
        this.assetTypes = response;
      });
  }

  onAssetTypeChange() {

    this.selectedAsset = null;
    this.assets = [];
    this.balances = [];

    this.loadAssets();
  }

  loadAssets() {
    this.assetService.getAssignedAssets(this.selectedAssetType)
      .subscribe(response => {
        this.assets = response;
      });
  }

  onAssetChange() {
    this.balances = [];


    this.reportService.getBalance(this.selectedAsset)
      .subscribe(response => {
        this.balances = response;
      });

  }

}
