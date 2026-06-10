import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_SERVER } from "@/types/database";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { searchPlayers } from "@/lib/data/players";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; server?: string }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const serverValue = Number(params.server);
  const server = Number.isFinite(serverValue) && serverValue > 0 ? serverValue : DEFAULT_SERVER;
  const { players, source } = await searchPlayers({ query, server, limit: 25 });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Player search</CardTitle>
            <Badge variant={source === "database" ? "secondary" : "warning"}>
              {source === "database" ? "Live data" : "Demo data"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Search by PID or player name. Results come from local snapshots first
            once sync has run, with a demo fallback in local preview mode.
          </p>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-col gap-3 md:flex-row">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search by player name or PID…"
              className="md:max-w-md"
            />
            <Input
              name="server"
              defaultValue={String(server)}
              inputMode="numeric"
              className="md:w-32"
              placeholder={`S${DEFAULT_SERVER}`}
            />
            <Button type="submit">Search</Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Active server filter: <span className="text-data text-primary">S{server}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{query ? `Results for "${query}"` : "Recent players"}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {players.length} result{players.length === 1 ? "" : "s"}
          </p>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="rounded-md border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">No matching players yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Run a manual sync from Admin, then search again. If you are in demo
                mode, search will still return sample players after setup is complete.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Player</th>
                    <th className="pb-2 pr-3 font-medium">Latest snapshot</th>
                    <th className="pb-2 pr-3 font-medium">Score</th>
                    <th className="pb-2 pr-3 font-medium">Kills</th>
                    <th className="pb-2 pr-3 font-medium">Rank</th>
                    <th className="pb-2 font-medium">State</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={`${player.server}:${player.pid}`} className="border-b border-border/50">
                      <td className="py-3 pr-3">
                        <Link
                          href={`/players/${player.pid}?server=${player.server}`}
                          className="font-medium hover:text-primary"
                        >
                          {player.displayName}
                        </Link>
                        <p className="text-data text-[11px] text-muted-foreground">
                          PID {player.pid} · S{player.server}
                        </p>
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {player.latestSnapshotAt
                          ? formatRelativeTime(player.latestSnapshotAt)
                          : "No snapshots yet"}
                      </td>
                      <td className="py-3 pr-3 text-data">
                        {player.score === null ? "—" : formatNumber(player.score)}
                      </td>
                      <td className="py-3 pr-3 text-data">
                        {player.kills === null ? "—" : formatNumber(player.kills)}
                      </td>
                      <td className="py-3 pr-3 text-data">
                        {player.rank === null ? "—" : formatNumber(player.rank)}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {player.isPinned ? <Badge variant="secondary">Pinned</Badge> : null}
                          {player.watchlistState === "flagged" ? (
                            <Badge variant="danger">Flagged</Badge>
                          ) : player.watchlistState === "watch" ? (
                            <Badge variant="warning">Watch</Badge>
                          ) : (
                            <Badge variant="outline">Tracked</Badge>
                          )}
                          {player.source === "demo" ? (
                            <Badge variant="secondary">Demo</Badge>
                          ) : null}
                        </div>
                        {player.notes ? (
                          <p className="mt-2 max-w-sm text-xs text-muted-foreground">
                            {player.notes}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
