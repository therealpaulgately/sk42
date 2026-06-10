import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_SERVER } from "@/types/database";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { getConquestReport } from "@/lib/data/conquest";

export default async function ConquestPage({
  searchParams,
}: {
  searchParams: Promise<{
    server?: string;
    startDate?: string;
    endDate?: string;
    trackedOnly?: string;
    sort?: "score" | "kills" | "deaths" | "rank";
  }>;
}) {
  const params = await searchParams;
  const serverValue = Number(params.server);
  const server = Number.isFinite(serverValue) && serverValue > 0 ? serverValue : DEFAULT_SERVER;
  const trackedOnly = params.trackedOnly === "1";
  const sort = params.sort ?? "score";
  const report = await getConquestReport({
    server,
    startDate: params.startDate,
    endDate: params.endDate,
    trackedOnly,
    sort,
  });

  const exportHref = new URLSearchParams({
    server: String(server),
    sort,
  });
  if (params.startDate) exportHref.set("startDate", params.startDate);
  if (params.endDate) exportHref.set("endDate", params.endDate);
  if (trackedOnly) exportHref.set("trackedOnly", "1");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Conquest tracker</CardTitle>
            <Badge variant={report.source === "database" ? "secondary" : "warning"}>
              {report.source === "database" ? "Live data" : "Demo data"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate conquest deltas from stored snapshots on S{server}.
          </p>
          <form method="get" className="grid gap-3 md:grid-cols-5">
            <input
              name="startDate"
              defaultValue={params.startDate ?? ""}
              placeholder="Start date"
              type="date"
              className="h-9 rounded-md border border-input bg-muted/50 px-3 text-sm"
            />
            <input
              name="endDate"
              defaultValue={params.endDate ?? ""}
              placeholder="End date"
              type="date"
              className="h-9 rounded-md border border-input bg-muted/50 px-3 text-sm"
            />
            <select
              name="sort"
              defaultValue={sort}
              className="h-9 rounded-md border border-input bg-muted/50 px-3 text-sm"
            >
              <option value="score">Score</option>
              <option value="kills">Kills</option>
              <option value="deaths">Deaths</option>
              <option value="rank">Rank</option>
            </select>
            <input
              name="server"
              defaultValue={String(server)}
              className="h-9 rounded-md border border-input bg-muted/50 px-3 text-sm"
            />
            <label className="flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm">
              <input type="checkbox" name="trackedOnly" value="1" defaultChecked={trackedOnly} />
              Tracked only
            </label>
            <div className="md:col-span-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Build report
              </button>
              <Link
                href={`/api/conquest/export?${exportHref.toString()}`}
                className="h-9 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Export CSV
              </Link>
            </div>
          </form>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Players" value={report.playerRows.length} />
        <Metric label="Tracked" value={report.playerRows.filter((row) => row.isTracked).length} />
        <Metric
          label="Alliance groups"
          value={report.allianceRows.length}
        />
        <Metric
          label="Anomalies"
          value={report.playerRows.filter((row) => row.anomaly).length}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Alliance deltas</CardTitle>
          <Badge variant="outline">{report.allianceRows.length} groups</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Alliance</th>
                  <th className="pb-2 pr-3 font-medium">Members</th>
                  <th className="pb-2 pr-3 font-medium">Tracked</th>
                  <th className="pb-2 pr-3 font-medium">Score Δ</th>
                  <th className="pb-2 pr-3 font-medium">Kills Δ</th>
                  <th className="pb-2 pr-3 font-medium">Deaths Δ</th>
                  <th className="pb-2 font-medium">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {report.allianceRows.map((row) => (
                  <tr key={row.allianceName} className="border-b border-border/50">
                    <td className="py-3 pr-3 font-medium">{row.allianceName}</td>
                    <td className="py-3 pr-3">{row.memberCount}</td>
                    <td className="py-3 pr-3">{row.trackedCount}</td>
                    <td className="py-3 pr-3 text-data">{formatNumber(row.scoreDelta)}</td>
                    <td className="py-3 pr-3">{formatNumber(row.killsDelta)}</td>
                    <td className="py-3 pr-3">{formatNumber(row.deathsDelta)}</td>
                    <td className="py-3">
                      {row.anomalyCount > 0 ? (
                        <Badge variant="warning">{row.anomalyCount} anomaly</Badge>
                      ) : (
                        <Badge variant="outline">Clear</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Player deltas</CardTitle>
          <Badge variant="outline">{report.playerRows.length} rows</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Player</th>
                  <th className="pb-2 pr-3 font-medium">Alliance</th>
                  <th className="pb-2 pr-3 font-medium">Contact</th>
                  <th className="pb-2 pr-3 font-medium">Score Δ</th>
                  <th className="pb-2 pr-3 font-medium">Kills Δ</th>
                  <th className="pb-2 pr-3 font-medium">Deaths Δ</th>
                  <th className="pb-2 pr-3 font-medium">Rank Δ</th>
                  <th className="pb-2 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {report.playerRows.map((row) => (
                  <tr
                    key={row.pid}
                    className={`border-b border-border/50 ${row.anomaly ? "bg-warning/10" : ""}`}
                  >
                    <td className="py-3 pr-3">
                      <div className="font-medium">{row.displayName}</div>
                      <div className="text-xs text-muted-foreground">PID {row.pid}</div>
                    </td>
                    <td className="py-3 pr-3">{row.allianceName ?? "Unallied"}</td>
                    <td className="py-3 pr-3 text-data">{row.discordHandle ?? "—"}</td>
                    <td className="py-3 pr-3">{formatNumber(row.scoreDelta)}</td>
                    <td className="py-3 pr-3">{formatNumber(row.killsDelta)}</td>
                    <td className="py-3 pr-3">{formatNumber(row.deathsDelta)}</td>
                    <td className="py-3 pr-3">{formatNumber(row.rankDelta)}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.isTracked ? <Badge variant="secondary">Tracked</Badge> : <Badge variant="outline">Untracked</Badge>}
                        {row.isPinned ? <Badge variant="warning">Pinned</Badge> : null}
                        {row.watchlistState !== "none" ? <Badge variant="danger">Watch</Badge> : null}
                        {row.anomaly ? <Badge variant="danger">Anomaly</Badge> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {report.playerRows.length > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Window: {formatRelativeTime(report.startDate)} to {formatRelativeTime(report.endDate)}.
            </p>
          ) : null}
        </CardContent>
      </Card>
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
