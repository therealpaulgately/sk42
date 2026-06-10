import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "status-chip",
        {
          default: "border-primary/30 bg-primary/10 text-primary",
          secondary: "border-border bg-secondary text-secondary-foreground",
          success: "border-success/30 bg-success/10 text-success",
          warning: "border-warning/30 bg-warning/10 text-warning",
          danger: "border-danger/30 bg-danger/10 text-danger",
          outline: "border-border text-foreground",
        }[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
