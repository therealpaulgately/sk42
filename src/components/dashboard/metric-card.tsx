import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDelta, formatNumber } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: number;
  hint?: string;
  accent?: "default" | "warning" | "success";
}

export function MetricCard({
  label,
  value,
  delta,
  hint,
  accent = "default",
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-semibold tracking-tight",
            accent === "warning" && "text-warning",
            accent === "success" && "text-success"
          )}
        >
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
        {delta !== undefined ? (
          <p
            className={cn(
              "text-data mt-1 text-xs",
              delta > 0 ? "text-success" : delta < 0 ? "text-danger" : "text-muted-foreground"
            )}
          >
            {formatDelta(delta)} since last snapshot
          </p>
        ) : hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
