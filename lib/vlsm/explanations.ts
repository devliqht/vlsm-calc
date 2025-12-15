import type { Subnet } from "./types";

export const getCalculationExplanation = (
  field: string,
  subnet?: Subnet,
): string => {
  switch (field) {
    case "networkAddress":
      return "Network address is the first address in the subnet range. It identifies the subnet and cannot be assigned to a host.";
    case "broadcast":
      return "Broadcast address is the last address in the subnet range. It is used to send data to all hosts in the subnet and cannot be assigned to a host.";
    case "firstUsable":
      return "First usable address is the network address + 1. It's the first address that can be assigned to a host.";
    case "lastUsable":
      return "Last usable address is the broadcast address - 1. It's the last address that can be assigned to a host.";
    case "subnetMask":
      return "Subnet mask defines which portion of the IP address is the network ID and which portion is the host ID.";
    case "cidr":
      return "CIDR (Classless Inter-Domain Routing) notation represents the subnet mask as a single number, indicating the number of bits used for the network portion.";
    case "allocatedHosts":
      return "Usable hosts is the number of addresses that can be assigned to devices. It's calculated as 2^(host bits) - 2 (subtracting network and broadcast addresses).";
    case "totalIPs":
      return "Total IPs is the total number of addresses in the subnet, including network and broadcast addresses. It's calculated as 2^(host bits).";
    case "wastedIPs":
      if (subnet) {
        return `Wasted IPs is the difference between allocated hosts (${subnet.allocatedHosts}) and required hosts (${subnet.requiredHosts}). This happens because subnet sizes must be powers of 2.`;
      }
      return "Wasted IPs is the difference between allocated hosts and required hosts. This happens because subnet sizes must be powers of 2.";
    case "delta":
      return "Delta is the increment between subnets in the same octet. It helps in quickly calculating the next subnet address.";
    case "borrowedBits":
      return "Borrowed bits are taken from the host portion of the original network to create subnets. More borrowed bits means more subnets but fewer hosts per subnet.";
    case "subnetIncrement":
      return "Subnet increment is the value by which subnet addresses increase. It's calculated as 2^(32 - new prefix) and helps in determining the next subnet address.";
    case "subnetBits":
      return "Subnet bits are the bits borrowed from the host portion to create subnets. The number of subnets possible is 2^(subnet bits).";
    case "hostBits":
      return "Host bits are the bits used to identify hosts within a subnet. The number of hosts possible is 2^(host bits) - 2.";
    case "totalSubnets":
      return "Total subnets is the maximum number of subnets that can be created with the given borrowed bits. It's calculated as 2^(borrowed bits).";
    default:
      return "No explanation available.";
  }
};
