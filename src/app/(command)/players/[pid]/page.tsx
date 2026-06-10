import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_SERVER } from "@/types/database";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { PlayerTrackerActions } from "@/components/players/player-tracker-actions";
import { PlayerTrendChart } from "@/components/players/player-trend-chart";
import { getAllianceOptions } from "@/lib/data/alliances";
import { getPlayerDetail } from "@/lib/data/players";

export default async function PlayerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ pid: string }>;
  searchParams: Promise<{ server?: string }>;
}) {
  const { pid } = await params;
  const paramsSearch = await searchParams;
  const serverValue = Number(paramsSearch.server);
  const server = Number.isFinite(serverValue) && serverValue > 0 ? serverValue : DEFAULT_SERVER;
  const editable = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const [player, alliances] = await Promise.all([
    getPlayerDetail({ pid, server }),
    getAllianceOptions(server),
  ]);

  if (!player) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No player record exists yet for PID {pid} on server S{server}. Run a
            sync or search the tracker again after data has been ingested.
          </p>
          <Button asChild variant="outline">
            <Link href="/players">Back to search</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const latest = player.snapshots[0];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl">{player.displayName}</CardTitle>
                <Badge variant="outline" className="text-data">
                  PID {player.pid}
                </Badge>
                <Badge variant="secondary">S{player.server}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {player.allianceName ? `Alliance ${player.allianceName}` : "No alliance recorded yet"}
                {player.discordHandle ? ` · ${player.discordHandle}` : ""}
                {player.latestSnapshotAt ? ` · Updated ${formatRelativeTime(player.latestSnapshotAt)}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {player.isPinned ? <Badge variant="secondary">Pinned</Badge> : null}
              {player.watchlistState === "flagged" ? (
                <Badge variant="danger">Flagged</Badge>
              ) : player.watchlistState === "watch" ? (
                <Badge variant="warning">Watch</Badge>
              ) : (
                <Badge variant="outline">Tracked</Badge>
              )}
              {player.source === "demo" ? <Badge variant="secondary">Demo</Badge> : null}
            </div>
          </div>
          {player.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {player.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
          {player.notes ? (
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {player.notes}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Latest score
              </p>
              <p className="mt-1 text-2xl font-semibold text-primary">
                {latest?.score === null || latest?.score === undefined ? "—" : formatNumber(latest.score)}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Latest kills
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {latest?.kills === null || latest?.kills === undefined ? "—" : formatNumber(latest.kills)}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Latest deaths
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {latest?.deaths === null || latest?.deaths === undefined ? "—" : formatNumber(latest.deaths)}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Latest rank
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {latest?.rank === null || latest?.rank === undefined ? "—" : formatNumber(latest.rank)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PlayerTrackerActions player={player} alliances={alliances} editable={editable} />

      <PlayerTrendChart snapshots={player.snapshots} />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent changes</CardTitle>
          <Badge variant="outline">{player.activity.length} events</Badge>
        </CardHeader>
        <CardContent>
          {player.activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent updates logged for this player yet.
            </p>
          ) : (
            <div className="space-y-3">
              {player.activity.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                >
                  <div className="space-y-1">
                    <p className="text-sm">{event.summary}</p>
                    <Badge variant="secondary" className="w-fit">
                      {event.event_type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(event.created_at)}
                  </time>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Snapshot history</CardTitle>
          <Badge variant="outline">{player.snapshots.length} snapshots</Badge>
        </CardHeader>
        <CardContent>
          {player.snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No snapshots stored yet for this player.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Captured</th>
                    <th className="pb-2 pr-3 font-medium">Score</th>
                    <th className="pb-2 pr-3 font-medium">Kills</th>
                    <th className="pb-2 pr-3 font-medium">Deaths</th>
                    <th className="pb-2 pr-3 font-medium">Rank</th>
                    <th className="pb-2 font-medium">Alliance</th>
                  </tr>
                </thead>
                <tbody>
                  {player.snapshots.map((snapshot) => (
                    <tr key={snapshot.id} className="border-b border-border/50">
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {formatRelativeTime(snapshot.captured_at)}
                      </td>
                      <td className="py-3 pr-3 text-data">
                        {snapshot.score === null ? "—" : formatNumber(snapshot.score)}
                      </td>
                      <td className="py-3 pr-3 text-data">
                        {snapshot.kills === null ? "—" : formatNumber(snapshot.kills)}
                      </td>
                      <td className="py-3 pr-3 text-data">
                        {snapshot.deaths === null ? "—" : formatNumber(snapshot.deaths)}
                      </td>
                      <td className="py-3 pr-3 text-data">
                        {snapshot.rank === null ? "—" : formatNumber(snapshot.rank)}
                      </td>
                      <td className="py-3 text-sm">
                        {snapshot.alliance_name ?? "—"}
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
