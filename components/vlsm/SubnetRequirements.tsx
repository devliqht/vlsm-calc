"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Subnet } from "@/lib/vlsm/types";

interface SubnetRequirementsProps {
  subnets: Subnet[];
  onAddSubnet: () => void;
  onRemoveSubnet: (id: string) => void;
  onUpdateSubnet: (
    id: string,
    field: keyof Subnet,
    value: string | number,
  ) => void;
}

export const SubnetRequirements = ({
  subnets,
  onAddSubnet,
  onRemoveSubnet,
  onUpdateSubnet,
}: SubnetRequirementsProps) => {
  return (
    <div id="subnet-requirements-section">
      <div className="flex justify-between items-center mb-2">
        <Label className="text-base font-medium">Subnet Requirements</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddSubnet}
          id="add-subnet-btn"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Subnet
        </Button>
      </div>

      <div className="space-y-3 mb-4">
        {subnets.map((subnet, index) => (
          <div key={subnet.id} className="flex items-center gap-3">
            <Input
              id={`subnet-name-${subnet.id}`}
              value={subnet.name}
              onChange={(e) =>
                onUpdateSubnet(subnet.id, "name", e.target.value)
              }
              className="flex-1"
              placeholder="Subnet Name"
            />
            <div className="flex-1">
              <Input
                id={`subnet-hosts-${subnet.id}`}
                type="number"
                min="1"
                value={subnet.requiredHosts || ""}
                onChange={(e) =>
                  onUpdateSubnet(
                    subnet.id,
                    "requiredHosts",
                    Number.parseInt(e.target.value) || 0,
                  )
                }
                className="w-full"
                placeholder="Required Hosts"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveSubnet(subnet.id)}
              disabled={subnets.length <= 1}
              id={`remove-subnet-${subnet.id}`}
              className={cn(
                "text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:text-red-300",
                subnets.length <= 1 && "opacity-50 cursor-not-allowed",
              )}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
