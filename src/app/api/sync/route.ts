import { NextResponse } from "next/server";
import { hasMinimumRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchAllRankingPages,
  hashPayload,
  type RawRankingRow,
} from "@/lib/warpath/client";
import { DEFAULT_SERVER } from "@/types/database";

/**
 * Manual sync endpoint — Phase 2 foundation.
 * Production should use a cron/worker with the same service-role path.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasMinimumRole(profile?.role, "officer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let server = DEFAULT_SERVER;
  try {
    const body = await request.json();
    if (body?.server !== undefined && body?.server !== null && body?.server !== "") {
      const parsedServer = Number(body.server);
      if (!Number.isInteger(parsedServer) || parsedServer <= 0) {
        return NextResponse.json({ error: "Invalid server" }, { status: 400 });
      }
      server = parsedServer;
    }
  } catch {
    // empty body is fine
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Config error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const syncRun = await admin
    .from("sync_runs")
    .insert({
      job_type: "ranking",
      server,
      status: "running",
    })
    .select("id")
    .single();

  if (syncRun.error) {
    return NextResponse.json(
      { error: "Failed to create sync run", detail: syncRun.error.message },
      { status: 500 }
    );
  }

  const runId = syncRun.data.id;

  try {
    const { pages } = await fetchAllRankingPages({ server, pageSize: 100, maxPages: 25 });
    const capturedAt = new Date().toISOString();
    const rowsByPid = new Map<string, { row: RawRankingRow; page: number }>();

    for (const pageRecord of pages) {
      for (const row of pageRecord.rows) {
        if (!row.pid) continue;
        rowsByPid.set(String(row.pid), {
          row,
          page: pageRecord.page,
        });
      }
    }

    const snapshots = Array.from(rowsByPid.values()).map(({ row, page }) => ({
      pid: String(row.pid),
      server,
      display_name: row.name ? String(row.name) : null,
      captured_at: capturedAt,
      score: row.score ?? null,
      kills: row.kills ?? null,
      deaths: row.deaths ?? null,
      rank: row.rank ?? null,
      alliance_name: row.alliance ? String(row.alliance) : null,
      raw_payload: { page, row },
      raw_payload_hash: hashPayload({ page, row }),
    }));

    if (snapshots.length > 0) {
      const { error: insertError } = await admin
        .from("player_snapshots")
        .insert(snapshots);

      if (insertError) throw insertError;
    }

    await admin
      .from("sync_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        records_processed: snapshots.length,
      })
      .eq("id", runId);

    await admin.from("activity_events").insert({
      event_type: "sync_completed",
      summary: `Ranking sync completed for server ${server} (${snapshots.length} records across ${pages.length} pages)`,
      actor_id: user.id,
      metadata: { server, records: snapshots.length, pages: pages.length },
    });

    return NextResponse.json({
      ok: true,
      server,
      records: snapshots.length,
      pages: pages.length,
      syncRunId: runId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await admin
      .from("sync_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", runId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
