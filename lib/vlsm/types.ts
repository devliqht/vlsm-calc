export interface Subnet {
  id: string;
  name: string;
  requiredHosts: number;
  allocatedHosts?: number;
  networkAddress?: string;
  subnetMask?: string;
  subnetMaskBinary?: string;
  cidr?: number;
  firstUsable?: string;
  lastUsable?: string;
  broadcast?: string;
  totalIPs?: number;
  delta?: number;
  borrowedBits?: number;
  position?: number;
}

export interface OriginalIPDetails {
  networkAddress: string;
  broadcast: string;
  firstUsable: string;
  lastUsable: string;
  subnetMask: string;
  delta?: number;
  totalIPs: number;
  subnetIncrement?: number;
  borrowedBits?: number;
  subnetBits?: number;
  hostBits?: number;
  totalSubnets?: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  ipAddress: string;
  cidr: string;
  subnets: Subnet[];
  results: Subnet[];
  originalIPDetails: OriginalIPDetails | null;
  mode: "vlsm" | "subnetting";
  numSubnets?: number;
}

export type CalculationMode = "vlsm" | "subnetting";
