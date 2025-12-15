"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calculator, Dices, Search } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useIPInput } from "@/hooks/useIPInput";
import { useVLSMCalculator } from "@/hooks/useVLSMCalculator";
import { useHistory } from "@/hooks/useHistory";
import { IPAddressInput } from "@/components/vlsm/IPAddressInput";
import { SubnetRequirements } from "@/components/vlsm/SubnetRequirements";
import { OriginalIPDetailsCard } from "@/components/vlsm/OriginalIPDetails";
import { ResultsTable } from "@/components/vlsm/ResultsTable";
import { HistoryCard } from "@/components/vlsm/HistoryCard";
import { ReferenceTables } from "@/components/vlsm/ReferenceTables";
import type { HistoryItem } from "@/lib/vlsm/types";
import {
  generateRandomIP,
  generateRandomPrefix,
  generateRandomNumSubnets,
  isValidIP,
  isValidCIDR,
} from "@/lib/vlsm/utils";
import { generateRandomSubnets } from "@/lib/vlsm/random";
import { calculateActualSubnetSize } from "@/lib/vlsm/utils";
import { useState } from "react";

export default function VLSMCalculator() {
  const ipInput = useIPInput();
  const calculator = useVLSMCalculator();
  const history = useHistory();
  const [subnetSearchStart, setSubnetSearchStart] = useState("");
  const [subnetSearchEnd, setSubnetSearchEnd] = useState("");

  const handleCalculate = () => {
    // validate IP
    if (!isValidIP(ipInput.ipParts)) {
      calculator.setError("Please enter a valid IP address");
      return;
    }

    // validate CIDR
    if (!isValidCIDR(ipInput.cidr)) {
      calculator.setError("Please enter a valid prefix (0-32)");
      return;
    }

    const ipAddress = ipInput.getIPString();
    const result = calculator.calculateVLSM(ipAddress, ipInput.cidr);

    if (result) {
      // add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ipAddress,
        cidr: ipInput.cidr,
        subnets: calculator.mode === "vlsm" ? [...calculator.subnets] : [],
        results: result.results,
        originalIPDetails: result.details,
        mode: calculator.mode,
        numSubnets: result.numSubnets,
      };
      history.addHistoryItem(historyItem);
    }
  };

  const handleGenerateRandom = () => {
    const randomIP = generateRandomIP();
    const randomPrefix = generateRandomPrefix();
    const ipAddress = randomIP.join(".");

    // update UI state
    ipInput.setIpParts(randomIP);
    ipInput.setCidr(randomPrefix);

    if (calculator.mode === "vlsm") {
      const prefixNum = Number.parseInt(randomPrefix);
      const availableHosts = Math.pow(2, 32 - prefixNum) - 2;
      const randomSubnets = generateRandomSubnets(availableHosts);

      // validate subnets fit
      let totalIPsNeeded = 0;
      for (const subnet of randomSubnets) {
        const hostsNeeded = subnet.requiredHosts + 2;
        const bitsNeeded = Math.ceil(Math.log2(hostsNeeded));
        const subnetSize = Math.pow(2, bitsNeeded);
        totalIPsNeeded += subnetSize;
      }

      if (totalIPsNeeded > availableHosts + 2) {
        return handleGenerateRandom();
      }

      calculator.setSubnets(randomSubnets);

      // calculate directly with generated values
      setTimeout(() => {
        const result = calculator.calculateVLSM(
          ipAddress,
          randomPrefix,
          randomSubnets,
        );
        if (result) {
          const historyItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            ipAddress,
            cidr: randomPrefix,
            subnets: [...randomSubnets],
            results: result.results,
            originalIPDetails: result.details,
            mode: calculator.mode,
          };
          history.addHistoryItem(historyItem);
        }
      }, 0);
    } else {
      const prefixNum = Number.parseInt(randomPrefix);
      const randomNumSubnets = generateRandomNumSubnets(prefixNum);
      calculator.setNumSubnets(randomNumSubnets);

      // calculate directly with generated values
      setTimeout(() => {
        const result = calculator.calculateVLSM(
          ipAddress,
          randomPrefix,
          undefined,
          randomNumSubnets,
        );
        if (result) {
          const historyItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            ipAddress,
            cidr: randomPrefix,
            subnets: [],
            results: result.results,
            originalIPDetails: result.details,
            mode: calculator.mode,
            numSubnets: result.numSubnets,
          };
          history.addHistoryItem(historyItem);
        }
      }, 0);
    }
  };

  const handleLoadHistory = (item: HistoryItem) => {
    calculator.setMode(item.mode);
    ipInput.setIPFromString(item.ipAddress);
    ipInput.setCidr(item.cidr);

    if (item.mode === "vlsm") {
      calculator.setSubnets(item.subnets);
    } else if (item.numSubnets) {
      calculator.setNumSubnets(item.numSubnets.toString());
    }

    calculator.setResults(item.results);
    calculator.setFilteredResults(item.results);
    calculator.setOriginalIPDetails(item.originalIPDetails);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    history.deleteHistoryItem(id);
  };

  const handleSearch = () => {
    calculator.searchSubnets(subnetSearchStart, subnetSearchEnd);
  };

  const handleClearSearch = () => {
    calculator.clearSearch();
    setSubnetSearchStart("");
    setSubnetSearchEnd("");
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Card */}
        <div className="lg:col-span-1">
          <div className="relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 -z-10 rounded-xl"></div>

            <Card id="vlsm-calculator">
              <CardHeader>
                <CardTitle>IP Subnet Calculator</CardTitle>
                <CardDescription>
                  Calculate subnets based on your requirements
                </CardDescription>
              </CardHeader>

              <CardContent>
                {calculator.error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-md">
                    {calculator.error}
                  </div>
                )}

                <Tabs
                  defaultValue="vlsm"
                  value={calculator.mode}
                  onValueChange={(value) =>
                    calculator.setMode(value as "vlsm" | "subnetting")
                  }
                  className="mb-6"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="vlsm">VLSM Mode</TabsTrigger>
                    <TabsTrigger value="subnetting">
                      Subnetting Mode
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="vlsm" className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Variable Length Subnet Masking (VLSM) allows you to create
                      subnets of different sizes based on host requirements.
                    </p>
                  </TabsContent>
                  <TabsContent value="subnetting" className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Subnetting mode creates equal-sized subnets based on the
                      number of subnets required.
                    </p>
                  </TabsContent>
                </Tabs>

                <div className="space-y-6">
                  <IPAddressInput
                    ipParts={ipInput.ipParts}
                    cidr={ipInput.cidr}
                    onIpChange={ipInput.handleIpChange}
                    onIpKeyDown={ipInput.handleIpKeyDown}
                    onCidrChange={ipInput.handleCidrChange}
                  />

                  {calculator.originalIPDetails && (
                    <OriginalIPDetailsCard
                      details={calculator.originalIPDetails}
                      mode={calculator.mode}
                    />
                  )}

                  {calculator.mode === "vlsm" ? (
                    <SubnetRequirements
                      subnets={calculator.subnets}
                      onAddSubnet={calculator.addSubnet}
                      onRemoveSubnet={calculator.removeSubnet}
                      onUpdateSubnet={calculator.updateSubnet}
                    />
                  ) : (
                    <div id="subnetting-input-section">
                      <Label
                        htmlFor="num-subnets"
                        className="text-base font-medium mb-2 block"
                      >
                        Number of Subnets
                      </Label>
                      <Input
                        id="num-subnets"
                        type="number"
                        min="1"
                        value={calculator.numSubnets}
                        onChange={(e) =>
                          calculator.setNumSubnets(e.target.value)
                        }
                        className="w-full"
                        placeholder="Enter number of subnets"
                      />
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  onClick={handleGenerateRandom}
                  className="w-full"
                  variant="secondary"
                  id="generate-random-btn"
                >
                  <Dices className="h-4 w-4 mr-2" /> Generate Random
                </Button>
                <Button
                  onClick={handleCalculate}
                  className="w-full"
                  id="calculate-btn"
                >
                  <Calculator className="h-4 w-4 mr-2" /> Calculate
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-2 h-[864px]">
          <Card className="h-full flex flex-col" id="results-section">
            <CardHeader className="flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle>
                  {calculator.mode === "vlsm"
                    ? "VLSM Results"
                    : "Subnetting Results"}
                </CardTitle>
                <CardDescription>
                  Subnet allocation based on your requirements
                </CardDescription>
              </div>

              {calculator.mode === "subnetting" &&
                calculator.results.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="Start"
                        value={subnetSearchStart}
                        onChange={(e) => setSubnetSearchStart(e.target.value)}
                        className="w-20"
                      />
                      <span>-</span>
                      <Input
                        placeholder="End"
                        value={subnetSearchEnd}
                        onChange={(e) => setSubnetSearchEnd(e.target.value)}
                        className="w-20"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSearch}>
                      <Search className="h-4 w-4 mr-1" /> Search
                    </Button>
                    {calculator.isSearching && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSearch}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ResultsTable results={calculator.filteredResults} />
            </CardContent>
          </Card>
        </div>

        {/* History Card */}
        <div className="lg:col-span-1">
          <HistoryCard
            history={history.history}
            onLoadHistoryItem={handleLoadHistory}
            onDeleteHistoryItem={handleDeleteHistory}
          />
        </div>

        {/* Reference Tables */}
        <div className="lg:col-span-2">
          <ReferenceTables />
        </div>
      </div>

      {/* Footer */}

      <div className="mt-8 flex flex-col items-center justify-center gap-4">
        <ThemeToggle />
        <footer className="text-center text-sm text-muted-foreground pb-6 flex items-center gap-2">
          <span>A</span>
          <Image
            src="/logo-extended-black.svg"
            alt="matlabs logo"
            width={160}
            height={60}
            className="inline-block dark:hidden"
          />
          <Image
            src="/logo-extended-white.svg"
            alt="matlabs logo"
            width={160}
            height={60}
            className="hidden dark:inline-block"
          />
          <span>creation, by</span>
          <a
            href="https://devliqht.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Matt Cabarrubias
          </a>
        </footer>
      </div>
    </div>
  );
}
