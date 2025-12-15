"use client";

import type { OriginalIPDetails, CalculationMode } from "@/lib/vlsm/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCalculationExplanation } from "@/lib/vlsm/explanations";

interface OriginalIPDetailsProps {
  details: OriginalIPDetails;
  mode: CalculationMode;
}

export const OriginalIPDetailsCard = ({
  details,
  mode,
}: OriginalIPDetailsProps) => {
  return (
    <div id="original-ip-details" className="bg-muted p-4 rounded-lg">
      <h3 className="font-medium text-base mb-2">Original IP Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hover:bg-accent p-1 rounded">
                <span className="font-medium">Network Address:</span>{" "}
                {details.networkAddress}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {getCalculationExplanation("networkAddress")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hover:bg-accent p-1 rounded">
                <span className="font-medium">Broadcast Address:</span>{" "}
                {details.broadcast}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {getCalculationExplanation("broadcast")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hover:bg-accent p-1 rounded">
                <span className="font-medium">First Usable:</span>{" "}
                {details.firstUsable}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {getCalculationExplanation("firstUsable")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hover:bg-accent p-1 rounded">
                <span className="font-medium">Last Usable:</span>{" "}
                {details.lastUsable}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {getCalculationExplanation("lastUsable")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hover:bg-accent p-1 rounded">
                <span className="font-medium">Subnet Mask:</span>{" "}
                {details.subnetMask}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {getCalculationExplanation("subnetMask")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hover:bg-accent p-1 rounded">
                <span className="font-medium">Total IPs:</span>{" "}
                {details.totalIPs.toLocaleString()}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {getCalculationExplanation("totalIPs")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {details.delta !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hover:bg-accent p-1 rounded">
                  <span className="font-medium">Delta:</span> {details.delta}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{getCalculationExplanation("delta")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {mode === "subnetting" && details.subnetIncrement !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hover:bg-accent p-1 rounded font-semibold text-primary">
                  <span className="font-medium">Subnet Increment:</span>{" "}
                  {details.subnetIncrement}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {getCalculationExplanation("subnetIncrement")}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {mode === "subnetting" && details.borrowedBits !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hover:bg-accent p-1 rounded font-semibold text-primary">
                  <span className="font-medium">Borrowed Bits:</span>{" "}
                  {details.borrowedBits}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {getCalculationExplanation("borrowedBits")}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {mode === "subnetting" && details.subnetBits !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hover:bg-accent p-1 rounded">
                  <span className="font-medium">Subnet Bits:</span>{" "}
                  {details.subnetBits}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {getCalculationExplanation("subnetBits")}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {mode === "subnetting" && details.hostBits !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hover:bg-accent p-1 rounded">
                  <span className="font-medium">Host Bits:</span>{" "}
                  {details.hostBits}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {getCalculationExplanation("hostBits")}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {mode === "subnetting" && details.totalSubnets !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hover:bg-accent p-1 rounded">
                  <span className="font-medium">Total Subnets:</span>{" "}
                  {details.totalSubnets}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {getCalculationExplanation("totalSubnets")}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
