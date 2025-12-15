"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";
import type { HistoryItem } from "@/lib/vlsm/types";
import { formatDate } from "@/lib/vlsm/utils";

interface HistoryCardProps {
  history: HistoryItem[];
  onLoadHistoryItem: (item: HistoryItem) => void;
  onDeleteHistoryItem: (id: string, e: React.MouseEvent) => void;
}

export const HistoryCard = ({
  history,
  onLoadHistoryItem,
  onDeleteHistoryItem,
}: HistoryCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" /> Calculation History
        </CardTitle>
        <CardDescription>Previous calculations</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onLoadHistoryItem(item)}
                  className="p-3 rounded-md cursor-pointer hover:bg-muted transition-colors border"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {item.ipAddress}/{item.cidr}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(item.timestamp)}
                      </div>
                      <div className="text-sm mt-1">
                        {item.mode === "vlsm"
                          ? `${item.subnets.length} subnet${item.subnets.length !== 1 ? "s" : ""}`
                          : `${item.numSubnets} equal subnet${item.numSubnets !== 1 ? "s" : ""}`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.mode === "vlsm" ? "VLSM Mode" : "Subnetting Mode"}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-red-500"
                      onClick={(e) => onDeleteHistoryItem(item.id, e)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No calculation history yet. Your calculations will appear here.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
