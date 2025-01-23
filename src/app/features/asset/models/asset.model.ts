export interface Asset {
    id: number;
    name: string;
    symbol: string;
    assetTypeName: string;
    isReference: boolean;
    isMainReference: boolean;
}