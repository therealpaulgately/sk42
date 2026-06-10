import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDelta } from "@/lib/utils";
import type { WatchlistMover } from "@/types/database";

interface WatchlistMoversProps {
  movers: WatchlistMover[];
}

export function WatchlistMovers({ movers }: WatchlistMoversProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Watchlist Movers</CardTitle>
        <Link
          href="/players"
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {movers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Pin players to see score, kill, and rank movement here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Player</th>
                  <th className="pb-2 pr-3 font-medium">Score Δ</th>
                  <th className="pb-2 pr-3 font-medium">Kills Δ</th>
                  <th className="pb-2 pr-3 font-medium">Rank Δ</th>
                  <th className="pb-2 font-medium">Alliance</th>
                </tr>
              </thead>
              <tbody>
                {movers.map((mover) => (
                  <tr key={mover.pid} className="border-b border-border/50">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/players/${mover.pid}`}
                        className="font-medium hover:text-primary"
                      >
                        {mover.displayName}
                      </Link>
                      <p className="text-data text-[11px] text-muted-foreground">
                        {mover.pid}
                      </p>
                    </td>
                    <td className="text-data py-2 pr-3">{formatDelta(mover.scoreDelta)}</td>
                    <td className="text-data py-2 pr-3">{formatDelta(mover.killsDelta)}</td>
                    <td className="text-data py-2 pr-3">{formatDelta(mover.rankDelta)}</td>
                    <td className="py-2">
                      {mover.allianceChanged ? (
                        <Badge variant="warning">Moved</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
