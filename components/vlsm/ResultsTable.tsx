"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Subnet } from "@/lib/vlsm/types";
import { TooltipCell } from "./TooltipCell";
import { getCalculationExplanation } from "@/lib/vlsm/explanations";

interface ResultsTableProps {
  results: Subnet[];
}

export const ResultsTable = ({ results }: ResultsTableProps) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No results to display. Enter your subnet requirements and calculate.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-scroll overflow-x-auto px-6 pt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Network Address</TableHead>
            <TableHead>Subnet Mask</TableHead>
            <TableHead>CIDR</TableHead>
            <TableHead>First Usable</TableHead>
            <TableHead>Last Usable</TableHead>
            <TableHead>Broadcast</TableHead>
            <TableHead>Usable Hosts</TableHead>
            <TableHead>Total IPs</TableHead>
            <TableHead>Wasted IPs</TableHead>
            <TableHead>Delta</TableHead>
            <TableHead>Borrowed Bits</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((subnet) => (
            <TableRow key={subnet.id}>
              <TableCell className="font-medium">{subnet.name}</TableCell>

              <TooltipCell
                content={subnet.networkAddress}
                tooltip={getCalculationExplanation("networkAddress")}
              />

              <TooltipCell
                content={
                  <>
                    <div>{subnet.subnetMask}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">
                      {subnet.subnetMaskBinary}
                    </div>
                  </>
                }
                tooltip={getCalculationExplanation("subnetMask")}
              />

              <TooltipCell
                content={`/${subnet.cidr}`}
                tooltip={getCalculationExplanation("cidr")}
              />

              <TooltipCell
                content={subnet.firstUsable}
                tooltip={getCalculationExplanation("firstUsable")}
              />

              <TooltipCell
                content={subnet.lastUsable}
                tooltip={getCalculationExplanation("lastUsable")}
              />

              <TooltipCell
                content={subnet.broadcast}
                tooltip={getCalculationExplanation("broadcast")}
              />

              <TooltipCell
                content={subnet.allocatedHosts}
                tooltip={getCalculationExplanation("allocatedHosts")}
              />

              <TooltipCell
                content={subnet.totalIPs?.toLocaleString()}
                tooltip={getCalculationExplanation("totalIPs")}
              />

              <TooltipCell
                content={(subnet.allocatedHosts ?? 0) - subnet.requiredHosts}
                tooltip={getCalculationExplanation("wastedIPs", subnet)}
              />

              <TooltipCell
                content={subnet.delta !== undefined ? subnet.delta : "-"}
                tooltip={getCalculationExplanation("delta")}
              />

              <TooltipCell
                content={subnet.borrowedBits}
                tooltip={getCalculationExplanation("borrowedBits")}
              />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
