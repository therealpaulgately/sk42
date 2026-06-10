import { createClient } from "@/lib/supabase/server";
import type { SyncRunSummary } from "@/types/database";

const demoRuns: SyncRunSummary[] = [
  {
    id: "demo-sync-1",
    job_type: "ranking",
    server: 42,
    status: "success",
    started_at: "2026-06-10T18:40:00.000Z",
    finished_at: "2026-06-10T18:41:12.000Z",
    records_processed: 418,
    error_message: null,
  },
  {
    id: "demo-sync-2",
    job_type: "ranking",
    server: 42,
    status: "failed",
    started_at: "2026-06-10T17:40:00.000Z",
    finished_at: "2026-06-10T17:40:41.000Z",
    records_processed: 0,
    error_message: "Warpath endpoint returned 502",
  },
];

function hasSupabaseConfig() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export async function getRecentSyncRuns(
  limit = 5
): Promise<{ runs: SyncRunSummary[]; source: "database" | "demo" }> {
  if (!hasSupabaseConfig()) {
    return { runs: demoRuns.slice(0, limit), source: "demo" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sync_runs")
      .select(
        "id, job_type, server, status, started_at, finished_at, records_processed, error_message"
      )
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      runs: (data ?? []) as SyncRunSummary[],
      source: "database",
    };
  } catch {
    return { runs: demoRuns.slice(0, limit), source: "demo" };
  }
}
