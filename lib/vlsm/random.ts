import type { Subnet } from "./types";
import { getRandomInt } from "./utils";

export const generateRandomSubnets = (availableHosts: number): Subnet[] => {
  const totalIPs = availableHosts + 2;

  // determine num of subnets (2-10, bias toward 3-5)
  let numSubnets: number;
  const roll = Math.random();
  if (roll < 0.6) {
    numSubnets = getRandomInt(3, 5);
  } else if (roll < 0.8) {
    numSubnets = 2;
  } else {
    numSubnets = getRandomInt(6, 10);
  }

  // ensure we don't create too many subnets for small networks
  if (availableHosts < numSubnets * 4) {
    numSubnets = Math.max(2, Math.floor(availableHosts / 4));
  }

  const randomSubnets: Subnet[] = [];
  let remainingIPs = totalIPs;

  const minIPsPerSubnet = 4;
  const minTotalIPs = numSubnets * minIPsPerSubnet;

  if (minTotalIPs > totalIPs) {
    numSubnets = Math.floor(totalIPs / minIPsPerSubnet);
    numSubnets = Math.max(1, numSubnets);
  }

  // allocate subnets one by one
  for (let i = 0; i < numSubnets; i++) {
    // for last subnet, use all remaining IPs
    if (i === numSubnets - 1) {
      const maxBits = Math.floor(Math.log2(remainingIPs));
      const subnetSize = Math.pow(2, maxBits);
      const usableHosts = subnetSize - 2;

      if (usableHosts >= 2) {
        randomSubnets.push({
          id: Date.now() + i.toString(),
          name: `Subnet ${i + 1}`,
          requiredHosts: getRandomInt(2, usableHosts),
        });
      }
      break;
    }

    // for other subnets, allocate random portion
    const maxRemainingSubnets = numSubnets - i;
    const minRemainingIPs = (maxRemainingSubnets - 1) * minIPsPerSubnet;
    const maxIPsForThisSubnet = remainingIPs - minRemainingIPs;

    const maxBits = Math.floor(Math.log2(maxIPsForThisSubnet));
    const bits = Math.max(2, getRandomInt(2, maxBits));
    const subnetSize = Math.pow(2, bits);
    const usableHosts = subnetSize - 2;

    randomSubnets.push({
      id: Date.now() + i.toString(),
      name: `Subnet ${i + 1}`,
      requiredHosts: getRandomInt(2, usableHosts),
    });

    remainingIPs -= subnetSize;
  }

  // fallback: create at least one minimal subnet
  if (randomSubnets.length === 0) {
    const maxBits = Math.floor(Math.log2(totalIPs));
    const subnetSize = Math.pow(2, maxBits);
    const usableHosts = subnetSize - 2;

    randomSubnets.push({
      id: Date.now() + "1",
      name: "Subnet 1",
      requiredHosts: Math.max(2, usableHosts),
    });
  }

  return randomSubnets;
};
