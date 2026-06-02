export interface AssetSplitEvent {
  id: number;
  assetId: number;
  assetName: string;
  symbol: string;
  date: Date;
  splitRatio: number;
}

export interface AssetSplitEventAdd {
  assetId: number;
  date: Date;
  splitRatio: number;
}
