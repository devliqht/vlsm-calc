"use client";

import { useState } from "react";
import type {
  Subnet,
  OriginalIPDetails,
  CalculationMode,
} from "@/lib/vlsm/types";
import {
  calculateOriginalIPDetails,
  calculateSubnets,
  calculateEqualSubnets,
  validateVLSMRequirements,
  validateSubnettingRequirements,
} from "@/lib/vlsm/calculations";

export const useVLSMCalculator = () => {
  const [mode, setMode] = useState<CalculationMode>("vlsm");
  const [numSubnets, setNumSubnets] = useState("");
  const [subnets, setSubnets] = useState<Subnet[]>([
    { id: "1", name: "Subnet 1", requiredHosts: 0 },
  ]);
  const [results, setResults] = useState<Subnet[]>([]);
  const [originalIPDetails, setOriginalIPDetails] =
    useState<OriginalIPDetails | null>(null);
  const [error, setError] = useState("");
  const [filteredResults, setFilteredResults] = useState<Subnet[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const addSubnet = () => {
    setSubnets([
      ...subnets,
      {
        id: Date.now().toString(),
        name: `Subnet ${subnets.length + 1}`,
        requiredHosts: 0,
      },
    ]);
  };

  const removeSubnet = (id: string) => {
    if (subnets.length > 1) {
      setSubnets(subnets.filter((subnet) => subnet.id !== id));
    }
  };

  const updateSubnet = (
    id: string,
    field: keyof Subnet,
    value: string | number,
  ) => {
    setSubnets(
      subnets.map((subnet) =>
        subnet.id === id ? { ...subnet, [field]: value } : subnet,
      ),
    );
  };

  const handleNumSubnetsChange = (value: string) => {
    const newValue = value.replace(/[^0-9]/g, "");
    const numValue = Number.parseInt(newValue);

    if (newValue === "" || numValue >= 0) {
      setNumSubnets(newValue);
    }
  };

  const calculateVLSM = (
    ipAddress: string,
    cidr: string,
    overrideSubnets?: Subnet[],
    overrideNumSubnets?: string,
  ) => {
    const cidrNum = Number.parseInt(cidr);
    const subnetsToUse = overrideSubnets || subnets;
    const numSubnetsToUse = overrideNumSubnets || numSubnets;

    if (mode === "vlsm") {
      // validate subnets
      if (subnetsToUse.some((subnet) => subnet.requiredHosts <= 0)) {
        setError("All subnets must have at least 1 required host");
        return null;
      }

      const validation = validateVLSMRequirements(cidrNum, subnetsToUse);
      if (!validation.valid) {
        setError(validation.error || "Validation failed");
        return null;
      }

      setError("");

      const details = calculateOriginalIPDetails(ipAddress, cidrNum);
      setOriginalIPDetails(details);

      const sortedSubnets = [...subnetsToUse].sort(
        (a, b) => b.requiredHosts - a.requiredHosts,
      );
      const calculatedSubnets = calculateSubnets(
        ipAddress,
        cidrNum,
        sortedSubnets,
      );

      setResults(calculatedSubnets);
      setFilteredResults(calculatedSubnets);
      setIsSearching(false);

      return { details, results: calculatedSubnets };
    } else {
      // subnetting mode
      const numSubnetsNum = Number.parseInt(numSubnetsToUse);
      if (isNaN(numSubnetsNum) || numSubnetsNum <= 0) {
        setError("Please enter a valid number of subnets");
        return null;
      }

      const validation = validateSubnettingRequirements(cidrNum, numSubnetsNum);
      if (!validation.valid) {
        setError(validation.error || "Validation failed");
        return null;
      }

      setError("");

      const borrowedBits = validation.borrowedBits!;
      const details = calculateOriginalIPDetails(
        ipAddress,
        cidrNum,
        borrowedBits,
      );
      setOriginalIPDetails(details);

      const calculatedSubnets = calculateEqualSubnets(
        ipAddress,
        cidrNum,
        numSubnetsNum,
        borrowedBits,
      );

      setResults(calculatedSubnets);
      setFilteredResults(calculatedSubnets);
      setIsSearching(false);

      return { details, results: calculatedSubnets, numSubnets: numSubnetsNum };
    }
  };

  const searchSubnets = (start: string, end: string) => {
    if (results.length === 0) return;

    const startNum = Number.parseInt(start) || 1;
    const endNum = Number.parseInt(end) || startNum;

    if (startNum < 1 || endNum < 1) {
      setError("Subnet numbers must be positive");
      return;
    }

    if (startNum > results.length || endNum > results.length) {
      setError(`Subnet numbers must be between 1 and ${results.length}`);
      return;
    }

    if (startNum > endNum) {
      setError("Start subnet must be less than or equal to end subnet");
      return;
    }

    setError("");

    const filtered = results.filter((subnet) => {
      const position = subnet.position || 0;
      return position >= startNum && position <= endNum;
    });

    setFilteredResults(filtered);
    setIsSearching(true);
  };

  const clearSearch = () => {
    setFilteredResults(results);
    setIsSearching(false);
  };

  const reset = () => {
    setSubnets([{ id: "1", name: "Subnet 1", requiredHosts: 0 }]);
    setResults([]);
    setFilteredResults([]);
    setOriginalIPDetails(null);
    setError("");
    setIsSearching(false);
  };

  return {
    mode,
    setMode,
    numSubnets,
    setNumSubnets: handleNumSubnetsChange,
    subnets,
    setSubnets,
    addSubnet,
    removeSubnet,
    updateSubnet,
    results,
    setResults,
    filteredResults,
    setFilteredResults,
    originalIPDetails,
    setOriginalIPDetails,
    error,
    setError,
    isSearching,
    calculateVLSM,
    searchSubnets,
    clearSearch,
    reset,
  };
};
