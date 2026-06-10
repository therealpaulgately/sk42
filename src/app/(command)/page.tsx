import Link from "next/link";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatRelativeTime } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { WatchlistMovers } from "@/components/dashboard/watchlist-movers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { metrics, activity, movers } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Command Summary
          </p>
          <p className="text-sm text-muted-foreground">
            Server{" "}
            <span className="text-data font-semibold text-primary">
              S{metrics.selectedServer}
            </span>
            {" · "}
            Last sync{" "}
            {metrics.lastSyncAt
              ? formatRelativeTime(metrics.lastSyncAt)
              : "not yet configured"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/conquest">Conquest report</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/players">Track player</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label="Tracked players" value={metrics.trackedPlayersCount} />
        <MetricCard label="Tracked alliances" value={metrics.trackedAlliancesCount} />
        <MetricCard label="Active server" value={`S${metrics.selectedServer}`} />
        <MetricCard
          label="Significant changes"
          value={metrics.significantChangesCount}
          accent="warning"
          hint="Since last snapshot"
        />
        <MetricCard
          label="Flagged / watchlist"
          value={metrics.flaggedPlayersCount}
          accent={metrics.flaggedPlayersCount > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Sync status"
          value={metrics.lastSyncAt ? "Healthy" : "Setup"}
          hint={metrics.lastSyncAt ? "Reading from local DB" : "Connect Supabase + sync job"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <WatchlistMovers movers={movers} />
        </div>
        <ActivityFeed events={activity} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Conquest Snapshot</CardTitle>
            <Link href="/conquest" className="text-xs text-primary hover:underline">
              Full tracker
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate conquest reports from stored snapshots once ingestion is
              running. Select a date window and compare tracked alliances.
            </p>
            <div className="mt-4 flex gap-2">
              <Badge variant="outline">Awaiting sync data</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leadership Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/leadership"
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary/50"
            >
              <span>Leadership roster</span>
              <Badge variant="secondary">Open</Badge>
            </Link>
            <Link
              href="/titles"
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary/50"
            >
              <span>Players missing titles</span>
              <Badge variant="warning">Review</Badge>
            </Link>
            <Link
              href="/alliances/compare"
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary/50"
            >
              <span>Compare alliances</span>
              <Badge variant="outline">Analyze</Badge>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
