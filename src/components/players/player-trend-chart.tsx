"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import type { PlayerSnapshot } from "@/types/database";

interface PlayerTrendChartProps {
  snapshots: PlayerSnapshot[];
}

function formatTick(value: string) {
  return formatRelativeTime(value);
}

export function PlayerTrendChart({ snapshots }: PlayerTrendChartProps) {
  const data = [...snapshots]
    .slice()
    .reverse()
    .map((snapshot) => ({
      captured_at: snapshot.captured_at,
      score: snapshot.score ?? 0,
      kills: snapshot.kills ?? 0,
      deaths: snapshot.deaths ?? 0,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snapshot trends</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No snapshot data yet to chart.
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis
                  dataKey="captured_at"
                  tickFormatter={formatTick}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  labelFormatter={(value) => formatRelativeTime(String(value))}
                  formatter={(value, name) => [
                    formatNumber(Number(value ?? 0)),
                    String(name),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="kills"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="deaths"
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
