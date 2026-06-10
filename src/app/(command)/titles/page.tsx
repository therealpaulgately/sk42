import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_SERVER } from "@/types/database";
import { formatRelativeTime } from "@/lib/utils";
import { BulkTitleAssignmentForm } from "@/components/titles/bulk-title-assignment-form";
import { TitleAssignmentForm } from "@/components/titles/title-assignment-form";
import { getTitleHistory } from "@/lib/data/phase4";

export default async function TitlesPage({
  searchParams,
}: {
  searchParams: Promise<{ server?: string; q?: string }>;
}) {
  const params = await searchParams;
  const serverValue = Number(params.server);
  const server = Number.isFinite(serverValue) && serverValue > 0 ? serverValue : DEFAULT_SERVER;
  const query = (params.q ?? "").trim().toLowerCase();
  const { history, missingTitleCount, source } = await getTitleHistory(server);

  const filteredHistory = history.filter(
    (row) =>
      !query ||
      row.displayName.toLowerCase().includes(query) ||
      row.pid.includes(query) ||
      row.title.toLowerCase().includes(query)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Title management</CardTitle>
            <Badge variant={source === "database" ? "secondary" : "warning"}>
              {source === "database" ? "Live data" : "Demo data"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Assign and review leadership roles for tracked players on S{server}.
          </p>
          <div className="space-y-4">
            <TitleAssignmentForm />
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                Bulk title edits
              </p>
              <BulkTitleAssignmentForm />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Title records" value={filteredHistory.length} />
            <Metric label="Missing titles" value={missingTitleCount} />
            <Metric
              label="Active titles"
              value={filteredHistory.filter((row) => !row.effectiveUntil).length}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Title history</CardTitle>
          <Badge variant="outline">{filteredHistory.length} records</Badge>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No title history available yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Player</th>
                    <th className="pb-2 pr-3 font-medium">Title</th>
                    <th className="pb-2 pr-3 font-medium">From</th>
                    <th className="pb-2 pr-3 font-medium">Until</th>
                    <th className="pb-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((row) => (
                    <tr key={row.id} className="border-b border-border/50">
                      <td className="py-3 pr-3">
                        <div className="font-medium">{row.displayName}</div>
                        <div className="text-xs text-muted-foreground">PID {row.pid}</div>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant="secondary">{row.title}</Badge>
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {formatRelativeTime(row.effectiveFrom)}
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {row.effectiveUntil ? formatRelativeTime(row.effectiveUntil) : "Active"}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {row.notes ?? "—"}
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
