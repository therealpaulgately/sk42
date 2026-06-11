import { SyncButton } from "@/components/admin/sync-button";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { getRecentSyncRuns } from "@/lib/data/sync";

export default async function AdminPage() {
  const { runs, source } = await getRecentSyncRuns(5);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Data Sync</CardTitle>
          <Badge variant="secondary">Phase 2</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <SyncButton />
          <p className="text-sm text-muted-foreground">
            Select a server, then trigger a manual ranking sync. Any signed-in user can run it, and{" "}
            <code className="text-data">SUPABASE_SERVICE_ROLE_KEY</code> for
            snapshot writes. Use a cron worker in production.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent sync runs</CardTitle>
          <Badge variant={source === "database" ? "secondary" : "warning"}>
            {source === "database" ? "Live" : "Demo"}
          </Badge>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sync runs logged yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Started</th>
                    <th className="pb-2 pr-3 font-medium">Server</th>
                    <th className="pb-2 pr-3 font-medium">Type</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Rows</th>
                    <th className="pb-2 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-border/50">
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {formatRelativeTime(run.started_at)}
                      </td>
                      <td className="py-3 pr-3 text-data">
                        {run.server === null ? "—" : `S${run.server}`}
                      </td>
                      <td className="py-3 pr-3">{run.job_type}</td>
                      <td className="py-3 pr-3">
                        <Badge
                          variant={
                            run.status === "success"
                              ? "success"
                              : run.status === "failed"
                                ? "danger"
                                : "secondary"
                          }
                        >
                          {run.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-data">
                        {run.records_processed}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {run.error_message ?? "OK"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ModulePlaceholder
        phase="Phase 6"
        features={[
          "Sync history and error dashboard",
          "User management and role assignment",
          "Audit log viewer",
          "Import/export tooling",
        ]}
      />
    </div>
  );
}
