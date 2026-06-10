import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_SERVER } from "@/types/database";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { getAllianceSummaries } from "@/lib/data/phase4";

export default async function AlliancesPage({
  searchParams,
}: {
  searchParams: Promise<{ server?: string; q?: string }>;
}) {
  const params = await searchParams;
  const serverValue = Number(params.server);
  const server = Number.isFinite(serverValue) && serverValue > 0 ? serverValue : DEFAULT_SERVER;
  const query = (params.q ?? "").trim().toLowerCase();
  const { summaries, source } = await getAllianceSummaries(server);

  const filteredSummaries = summaries.filter(
    (alliance) =>
      !query ||
      alliance.name.toLowerCase().includes(query) ||
      (alliance.notes ?? "").toLowerCase().includes(query)
  );

  const totals = filteredSummaries.reduce(
    (acc, alliance) => {
      acc.members += alliance.memberCount;
      acc.score += alliance.totalScore;
      acc.kills += alliance.totalKills;
      acc.deaths += alliance.totalDeaths;
      return acc;
    },
    { members: 0, score: 0, kills: 0, deaths: 0 }
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Alliance overview</CardTitle>
            <Badge variant={source === "database" ? "secondary" : "warning"}>
              {source === "database" ? "Live data" : "Demo data"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Aggregated from tracked players and stored snapshots on S{server}.
          </p>
          <form method="get" className="flex flex-wrap gap-3">
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search alliances"
              className="h-9 rounded-md border border-input bg-muted/50 px-3 text-sm"
            />
            <input
              name="server"
              defaultValue={String(server)}
              className="h-9 w-28 rounded-md border border-input bg-muted/50 px-3 text-sm"
            />
            <button
              type="submit"
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Filter
            </button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Alliances</p>
              <p className="mt-1 text-2xl font-semibold">{filteredSummaries.length}</p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tracked members</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(totals.members)}</p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Score</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(totals.score)}</p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Kills</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(totals.kills)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredSummaries.map((alliance) => (
          <Card key={alliance.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{alliance.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {alliance.notes ?? "No notes"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={alliance.isTracked ? "secondary" : "outline"}>
                  {alliance.isTracked ? "Tracked" : "Untracked"}
                </Badge>
                {alliance.latestSnapshotAt ? (
                  <Badge variant="outline">{formatRelativeTime(alliance.latestSnapshotAt)}</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Members</p>
                  <p className="mt-1 text-xl font-semibold">{alliance.memberCount}</p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Pinned</p>
                  <p className="mt-1 text-xl font-semibold">{alliance.pinnedCount}</p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Watch</p>
                  <p className="mt-1 text-xl font-semibold">{alliance.watchlistCount}</p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Deaths</p>
                  <p className="mt-1 text-xl font-semibold">{formatNumber(alliance.totalDeaths)}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Score</p>
                  <p className="mt-1 text-lg font-semibold text-primary">
                    {formatNumber(alliance.totalScore)}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Kills</p>
                  <p className="mt-1 text-lg font-semibold text-success">
                    {formatNumber(alliance.totalKills)}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest</p>
                  <p className="mt-1 text-lg font-semibold">
                    {alliance.latestSnapshotAt ? formatRelativeTime(alliance.latestSnapshotAt) : "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Top members
                </p>
                <div className="space-y-2">
                  {alliance.topMembers.map((member) => (
                    <div
                      key={member.pid}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{member.displayName}</p>
                        <p className="text-xs text-muted-foreground">PID {member.pid}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.isPinned ? <Badge variant="secondary">Pinned</Badge> : null}
                        <span className="text-data">Score {formatNumber(member.score ?? 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
