import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_SERVER } from "@/types/database";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { getAllianceComparison } from "@/lib/data/phase4";

export default async function CompareAlliancesPage({
  searchParams,
}: {
  searchParams: Promise<{ server?: string; a?: string; b?: string }>;
}) {
  const params = await searchParams;
  const serverValue = Number(params.server);
  const server = Number.isFinite(serverValue) && serverValue > 0 ? serverValue : DEFAULT_SERVER;
  const { summaries, left, right, source } = await getAllianceComparison({
    server,
    leftAllianceId: params.a,
    rightAllianceId: params.b,
  });

  const comparisons = left && right
    ? [
        { label: "Members", leftValue: left.memberCount, rightValue: right.memberCount },
        { label: "Pinned", leftValue: left.pinnedCount, rightValue: right.pinnedCount },
        { label: "Watchlisted", leftValue: left.watchlistCount, rightValue: right.watchlistCount },
        { label: "Score", leftValue: left.totalScore, rightValue: right.totalScore },
        { label: "Kills", leftValue: left.totalKills, rightValue: right.totalKills },
        { label: "Deaths", leftValue: left.totalDeaths, rightValue: right.totalDeaths },
      ]
    : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Compare alliances</CardTitle>
            <Badge variant={source === "database" ? "secondary" : "warning"}>
              {source === "database" ? "Live data" : "Demo data"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Side-by-side strategic comparison for server S{server}.
          </p>
          <form method="get" className="flex flex-wrap gap-3">
            <select
              name="a"
              defaultValue={left?.id ?? ""}
              className="h-9 rounded-md border border-input bg-muted/50 px-3 text-sm"
            >
              {summaries.map((summary) => (
                <option key={summary.id} value={summary.id}>
                  {summary.name}
                </option>
              ))}
            </select>
            <select
              name="b"
              defaultValue={right?.id ?? ""}
              className="h-9 rounded-md border border-input bg-muted/50 px-3 text-sm"
            >
              {summaries.map((summary) => (
                <option key={summary.id} value={summary.id}>
                  {summary.name}
                </option>
              ))}
            </select>
            <input
              name="server"
              defaultValue={String(server)}
              className="h-9 w-28 rounded-md border border-input bg-muted/50 px-3 text-sm"
            />
            <button
              type="submit"
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Compare
            </button>
          </form>
        </CardHeader>
      </Card>

      {left && right ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Comparison summary</CardTitle>
            <Badge variant="outline">Delta view</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {comparisons.map((metric) => {
              const leftValue = metric.leftValue;
              const rightValue = metric.rightValue;
              const max = Math.max(leftValue, rightValue, 1);
              const leftShare = (leftValue / max) * 100;
              const rightShare = (rightValue / max) * 100;
              const delta = leftValue - rightValue;
              const direction =
                delta === 0 ? "Even" : delta > 0 ? `${left.name} leads` : `${right.name} leads`;

              return (
                <div key={metric.label} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{metric.label}</span>
                    <span className="text-muted-foreground">{direction}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${leftShare}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(leftValue)} vs {formatNumber(rightValue)}
                    </span>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="ml-auto h-full rounded-full bg-warning" style={{ width: `${rightShare}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {[left, right].map((alliance, index) => (
          <Card key={alliance?.id ?? index}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{alliance?.name ?? "Select an alliance"}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {index === 0 ? "Left side" : "Right side"}
                </p>
              </div>
              {alliance ? (
                <Badge variant={alliance.isTracked ? "secondary" : "outline"}>
                  {alliance.isTracked ? "Tracked" : "Untracked"}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              {alliance ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric label="Members" value={alliance.memberCount} />
                    <Metric label="Pinned" value={alliance.pinnedCount} />
                    <Metric label="Watch" value={alliance.watchlistCount} />
                    <Metric label="Score" value={formatNumber(alliance.totalScore)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <DeltaMetric label="Kills" value={alliance.totalKills} />
                    <DeltaMetric label="Deaths" value={alliance.totalDeaths} />
                    <DeltaMetric
                      label="Latest update"
                      value={alliance.latestSnapshotAt ? formatRelativeTime(alliance.latestSnapshotAt) : "—"}
                    />
                  </div>
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
                        <span className="text-data">Score {formatNumber(member.score ?? 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select an alliance to see the comparison.
                </p>
              )}
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
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function DeltaMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-muted/10 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
