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
  isLoading: boolean = true;
  totalBalances: TotalBalance[] = [];
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
      .subscribe((response: TotalBalance[]) => {
        this.totalBalances = response;
        console.log(this.totalBalances);
        this.isLoading = false;
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

  getTextColor(backgroundColor: string): string {
    // Eliminar el símbolo # si está presente
    const hex = backgroundColor.replace('#', '');
    
    // Convertir a componentes RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
  
    // Convertir a luminancia relativa
    const luminance = 0.2126 * this.calculateChannel(r) +
                      0.7152 * this.calculateChannel(g) +
                      0.0722 * this.calculateChannel(b);
  
    // Devolver blanco o negro según el contraste
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }
  
  calculateChannel(channel: number): number {
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  }
  

}
