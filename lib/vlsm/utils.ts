// IP/Binary conversion utils
export const ipToBinary = (ip: string): string => {
  return ip
    .split(".")
    .map((octet) => Number.parseInt(octet).toString(2).padStart(8, "0"))
    .join("");
};

export const binaryToIp = (binary: string): string => {
  return [0, 8, 16, 24]
    .map((i) => Number.parseInt(binary.substr(i, 8), 2))
    .join(".");
};

export const decimalToBinary = (ip: string): string => {
  return ip
    .split(".")
    .map((octet) => Number.parseInt(octet).toString(2).padStart(8, "0"))
    .join(".");
};

export const cidrToSubnetMask = (cidr: number): string => {
  const binary = "1".repeat(cidr).padEnd(32, "0");
  return binaryToIp(binary);
};

export const incrementBinary = (binary: string): string => {
  const decimal = Number.parseInt(binary, 2) + 1;
  return decimal.toString(2).padStart(32, "0");
};

// Calculation utils
export const calculateDelta = (prefix: number): number | undefined => {
  // no delta for these specific prefixes
  if (
    prefix === 0 ||
    prefix === 8 ||
    prefix === 16 ||
    prefix === 24 ||
    prefix === 32
  ) {
    return undefined;
  }

  // determine group and calc delta
  if (prefix > 24 && prefix < 32) {
    return Math.pow(2, 32 - prefix);
  } else if (prefix > 16 && prefix < 24) {
    return Math.pow(2, 24 - prefix);
  } else if (prefix > 8 && prefix < 16) {
    return Math.pow(2, 16 - prefix);
  } else if (prefix > 0 && prefix < 8) {
    return Math.pow(2, 8 - prefix);
  }

  return undefined;
};

export const calculateActualSubnetSize = (requiredHosts: number): number => {
  const totalNeeded = requiredHosts + 2;
  const bitsNeeded = Math.ceil(Math.log2(totalNeeded));
  return Math.pow(2, bitsNeeded) - 2;
};

// Formatting utils
export const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

// Random generation utils
export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateRandomIP = (): string[] => {
  const firstOctet = getRandomInt(1, 223);
  const secondOctet = getRandomInt(0, 255);
  const thirdOctet = getRandomInt(0, 255);
  const fourthOctet = getRandomInt(0, 255);

  return [
    firstOctet.toString(),
    secondOctet.toString(),
    thirdOctet.toString(),
    fourthOctet.toString(),
  ];
};

export const generateRandomPrefix = (): string => {
  return getRandomInt(16, 28).toString();
};

export const generateRandomNumSubnets = (prefix: number): string => {
  const maxBorrowedBits = 30 - prefix;
  const limitedBorrowedBits = Math.min(maxBorrowedBits, 8);
  const maxSubnets = Math.pow(2, limitedBorrowedBits);
  return getRandomInt(2, Math.min(maxSubnets, 16)).toString();
};

// Validation utils
export const isValidIP = (ipParts: string[]): boolean => {
  return !ipParts.some((part) => part === "" || Number.parseInt(part) > 255);
};

export const isValidCIDR = (cidr: string): boolean => {
  const cidrNum = Number.parseInt(cidr);
  return !isNaN(cidrNum) && cidrNum >= 0 && cidrNum <= 32;
};
