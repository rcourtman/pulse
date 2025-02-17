import React from 'react';
import { cn } from "../../lib/utils";

const ContainerRowBase = ({
  children,
  className,
  compact = false,
  isHeader = false
}) => {
  return (
    <div
      className={cn(
        "relative grid grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr_40px] gap-4 px-4 rounded",
        !isHeader && "hover:bg-gray-800 transition-colors",
        compact ? "py-1" : "py-2",
        className
      )}
    >
      {children}
    </div>
  );
};

// Reusable metric cell component
const MetricCell = ({
  children,
  className
}) => (
  <div className={cn("flex items-center gap-2", className)}>
    {children}
  </div>
);

ContainerRowBase.MetricCell = MetricCell;

export default ContainerRowBase;