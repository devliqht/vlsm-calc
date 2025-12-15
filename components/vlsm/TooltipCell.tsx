"use client";

import { TableCell } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipCellProps {
  content: React.ReactNode;
  tooltip: string;
  className?: string;
}

export const TooltipCell = ({
  content,
  tooltip,
  className,
}: TooltipCellProps) => {
  return (
    <TableCell className={`hover:bg-accent cursor-help ${className || ""}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">{content}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
};
