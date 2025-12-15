import type { Subnet, OriginalIPDetails } from "./types";
import {
  ipToBinary,
  binaryToIp,
  cidrToSubnetMask,
  calculateDelta,
  incrementBinary,
  decimalToBinary,
  calculateActualSubnetSize,
} from "./utils";

export const calculateOriginalIPDetails = (
  ipAddress: string,
  prefix: number,
  borrowedBits?: number,
): OriginalIPDetails => {
  const ipBinary = ipToBinary(ipAddress);
  const networkBinary = ipBinary.substring(0, prefix).padEnd(32, "0");
  const broadcastBinary = ipBinary.substring(0, prefix).padEnd(32, "1");

  const networkAddress = binaryToIp(networkBinary);
  const broadcast = binaryToIp(broadcastBinary);

  const firstUsableBinary = networkBinary.substring(0, 32).slice(0, -1) + "1";
  const lastUsableBinary = broadcastBinary.substring(0, 32).slice(0, -1) + "0";

  const firstUsable = binaryToIp(firstUsableBinary);
  const lastUsable = binaryToIp(lastUsableBinary);

  const subnetMask = cidrToSubnetMask(prefix);
  const delta = calculateDelta(prefix);
  const totalIPs = Math.pow(2, 32 - prefix);

  let subnetIncrement: number | undefined;
  let subnetBits: number | undefined;
  let hostBits: number | undefined;
  let totalSubnets: number | undefined;

  if (borrowedBits !== undefined) {
    if (prefix + borrowedBits > 24) {
      subnetIncrement = Math.pow(2, 32 - (prefix + borrowedBits));
    } else if (prefix + borrowedBits > 16) {
      subnetIncrement = Math.pow(2, 24 - (prefix + borrowedBits));
    } else if (prefix + borrowedBits > 8) {
      subnetIncrement = Math.pow(2, 16 - (prefix + borrowedBits));
    } else {
      subnetIncrement = Math.pow(2, 8 - (prefix + borrowedBits));
    }

    subnetBits = borrowedBits;
    hostBits = 32 - (prefix + borrowedBits);
    totalSubnets = Math.pow(2, borrowedBits);
  }

  return {
    networkAddress,
    broadcast,
    firstUsable,
    lastUsable,
    subnetMask,
    delta,
    totalIPs,
    subnetIncrement,
    borrowedBits,
    subnetBits,
    hostBits,
    totalSubnets,
  };
};

export const calculateSubnets = (
  ipAddress: string,
  cidr: number,
  subnets: Subnet[],
): Subnet[] => {
  const ipBinary = ipToBinary(ipAddress);
  let networkBinary = ipBinary.substring(0, cidr).padEnd(32, "0");

  const results: Subnet[] = [];

  for (const subnet of subnets) {
    const hostsNeeded = subnet.requiredHosts + 2;
    const bitsNeeded = Math.ceil(Math.log2(hostsNeeded));
    const subnetCidr = 32 - bitsNeeded;
    const borrowedBits = subnetCidr - cidr;

    const subnetMask = cidrToSubnetMask(subnetCidr);
    const subnetMaskBinary = decimalToBinary(subnetMask);
    const networkAddress = binaryToIp(networkBinary);

    const broadcastBinary = networkBinary
      .substring(0, subnetCidr)
      .padEnd(32, "1");
    const broadcastAddress = binaryToIp(broadcastBinary);

    const firstUsableBinary = networkBinary.substring(0, 32).slice(0, -1) + "1";
    const lastUsableBinary =
      broadcastBinary.substring(0, 32).slice(0, -1) + "0";

    const firstUsable = binaryToIp(firstUsableBinary);
    const lastUsable = binaryToIp(lastUsableBinary);
    const totalIPs = Math.pow(2, 32 - subnetCidr);
    const delta = calculateDelta(subnetCidr);

    results.push({
      ...subnet,
      networkAddress,
      subnetMask,
      subnetMaskBinary,
      cidr: subnetCidr,
      firstUsable,
      lastUsable,
      broadcast: broadcastAddress,
      allocatedHosts: totalIPs - 2,
      totalIPs,
      delta,
      borrowedBits,
    });

    const nextNetworkBinary = incrementBinary(broadcastBinary);
    networkBinary = nextNetworkBinary;
  }

  return results;
};

export const calculateEqualSubnets = (
  ipAddress: string,
  cidr: number,
  numSubnets: number,
  borrowedBits: number,
): Subnet[] => {
  const ipBinary = ipToBinary(ipAddress);
  const networkBinary = ipBinary.substring(0, cidr).padEnd(32, "0");
  const subnetCidr = cidr + borrowedBits;

  const subnetMask = cidrToSubnetMask(subnetCidr);
  const subnetMaskBinary = decimalToBinary(subnetMask);
  const totalIPsPerSubnet = Math.pow(2, 32 - subnetCidr);
  const usableHostsPerSubnet = totalIPsPerSubnet - 2;
  const delta = calculateDelta(subnetCidr);

  const results: Subnet[] = [];
  const actualNumSubnets = Math.pow(2, borrowedBits);

  for (let i = 0; i < actualNumSubnets; i++) {
    const subnetNetworkBinary =
      networkBinary.substring(0, cidr) +
      i
        .toString(2)
        .padStart(borrowedBits, "0")
        .padEnd(32 - cidr, "0");

    const subnetNetworkAddress = binaryToIp(subnetNetworkBinary);

    const broadcastBinary = subnetNetworkBinary
      .substring(0, subnetCidr)
      .padEnd(32, "1");
    const broadcastAddress = binaryToIp(broadcastBinary);

    const firstUsableBinary =
      subnetNetworkBinary.substring(0, 32).slice(0, -1) + "1";
    const lastUsableBinary =
      broadcastBinary.substring(0, 32).slice(0, -1) + "0";

    const firstUsable = binaryToIp(firstUsableBinary);
    const lastUsable = binaryToIp(lastUsableBinary);

    results.push({
      id: (i + 1).toString(),
      name: `Subnet ${i + 1}`,
      requiredHosts: usableHostsPerSubnet,
      networkAddress: subnetNetworkAddress,
      subnetMask,
      subnetMaskBinary,
      cidr: subnetCidr,
      firstUsable,
      lastUsable,
      broadcast: broadcastAddress,
      allocatedHosts: usableHostsPerSubnet,
      totalIPs: totalIPsPerSubnet,
      delta,
      borrowedBits,
      position: i + 1,
    });
  }

  return results;
};

export const validateVLSMRequirements = (
  cidr: number,
  subnets: Subnet[],
): { valid: boolean; error?: string } => {
  const availableHosts = Math.pow(2, 32 - cidr) - 2;
  let totalActualSubnetSize = 0;

  for (const subnet of subnets) {
    totalActualSubnetSize += calculateActualSubnetSize(subnet.requiredHosts);
  }

  if (totalActualSubnetSize > availableHosts) {
    return {
      valid: false,
      error: `Total subnet size (${totalActualSubnetSize}) exceeds available hosts (${availableHosts}) for /${cidr} prefix. Subnet sizes must be powers of 2 minus 2.`,
    };
  }

  return { valid: true };
};

export const validateSubnettingRequirements = (
  cidr: number,
  numSubnets: number,
): { valid: boolean; error?: string; borrowedBits?: number } => {
  const borrowedBits = Math.ceil(Math.log2(numSubnets));

  if (cidr + borrowedBits > 30) {
    return {
      valid: false,
      error: `Cannot create ${numSubnets} subnets with /${cidr} prefix. Not enough host bits available.`,
    };
  }

  return { valid: true, borrowedBits };
};
