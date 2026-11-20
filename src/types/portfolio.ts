/** Portfolio summary shapes shared by the client profile, Client Hub and Command Center. */

export type AssetHeroSummary = {
  netValue: string;
  changeAmount: string;
  changePercent: string;
  changePositive: boolean;
  lineAvailable: string;
  cash: string;
  lastUpdatedDate: string;
  lastUpdatedTime: string;
};

export type AssetAllocationSlice = {
  label: string;
  percent: number;
  statusIcon: string;
};

export type AssetSummary = AssetHeroSummary & {
  allocationSlices: AssetAllocationSlice[];
};
