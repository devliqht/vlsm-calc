"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IPAddressInputProps {
  ipParts: string[];
  cidr: string;
  onIpChange: (index: number, value: string) => void;
  onIpKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onCidrChange: (value: string) => void;
}

export const IPAddressInput = ({
  ipParts,
  cidr,
  onIpChange,
  onIpKeyDown,
  onCidrChange,
}: IPAddressInputProps) => {
  return (
    <div id="ip-input-section">
      <Label htmlFor="ip-part-0" className="text-base font-medium mb-2 block">
        IP Address
      </Label>
      <div className="flex flex-wrap items-center gap-1">
        <div className="flex items-center">
          {ipParts.map((part, index) => (
            <div key={index} className="flex items-center">
              <Input
                id={`ip-part-${index}`}
                value={part}
                onChange={(e) => onIpChange(index, e.target.value)}
                onKeyDown={(e) => onIpKeyDown(index, e)}
                className="w-14 text-center"
                maxLength={3}
              />
              {index < 3 && <span className="mx-1 text-lg">.</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center mt-2 sm:mt-0">
          <span className="mx-2 text-lg">/</span>
          <Input
            id="cidr-input"
            value={cidr}
            onChange={(e) => onCidrChange(e.target.value)}
            className="w-16 text-center"
            maxLength={2}
            placeholder="Prefix"
          />
        </div>
      </div>
    </div>
  );
};
