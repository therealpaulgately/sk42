import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_SERVER } from "@/types/database";
import { formatRelativeTime } from "@/lib/utils";
import { getLeadershipRoster } from "@/lib/data/phase4";

export default async function LeadershipPage({
  searchParams,
}: {
  searchParams: Promise<{ server?: string; q?: string }>;
}) {
  const params = await searchParams;
  const serverValue = Number(params.server);
  const server = Number.isFinite(serverValue) && serverValue > 0 ? serverValue : DEFAULT_SERVER;
  const rawQuery = (params.q ?? "").trim();
  const query = rawQuery.toLowerCase();
  const titleQuery = query.startsWith("title:") ? query.slice(6).trim() : "";
  const { roster, source } = await getLeadershipRoster(server);

  const filteredRoster = roster.filter((entry) => {
    if (!query) return true;
    const titleMatches = titleQuery ? (entry.title ?? "").toLowerCase().includes(titleQuery) : false;
    return (
      titleMatches ||
      entry.displayName.toLowerCase().includes(query) ||
      entry.pid.includes(query) ||
      (entry.discordHandle ?? "").toLowerCase().includes(query) ||
      (entry.title ?? "").toLowerCase().includes(query) ||
      (entry.allianceName ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Leadership roster</CardTitle>
            <Badge variant={source === "database" ? "secondary" : "warning"}>
              {source === "database" ? "Live data" : "Demo data"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Snapshot-backed roster for officers, leaders, and titled players.
          </p>
          <p className="text-xs text-muted-foreground">
            Search supports player name, PID, alliance, Discord handle, or use{" "}
            <code className="text-data">title:Officer</code> style queries.
          </p>
          <form method="get" className="flex flex-wrap gap-3">
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search roster"
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
            <Metric label="Roster size" value={filteredRoster.length} />
            <Metric
              label="Pinned"
              value={filteredRoster.filter((entry) => entry.isPinned).length}
            />
            <Metric
              label="Titled"
              value={filteredRoster.filter((entry) => entry.title).length}
            />
            <Metric
              label="Watchlisted"
              value={filteredRoster.filter((entry) => entry.watchlistState !== "none").length}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredRoster.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{entry.displayName}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  PID {entry.pid}
                  {entry.latestSnapshotAt ? ` · Updated ${formatRelativeTime(entry.latestSnapshotAt)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.title ? <Badge variant="secondary">{entry.title}</Badge> : <Badge variant="outline">No title</Badge>}
                {entry.isPinned ? <Badge variant="warning">Pinned</Badge> : null}
                {entry.watchlistState === "flagged" ? <Badge variant="danger">Flagged</Badge> : null}
                {entry.watchlistState === "watch" ? <Badge variant="warning">Watch</Badge> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {entry.allianceName ? `Alliance ${entry.allianceName}` : "No alliance"}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Contact: </span>
                <span className="text-data">{entry.discordHandle ?? "—"}</span>
              </div>
              {entry.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <Link href={`/players/${entry.pid}?server=${server}`} className="text-sm text-primary hover:underline">
                Open player detail
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
