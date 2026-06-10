import { NextResponse } from "next/server";
import { hasMinimumRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchRankingPage, hashPayload } from "@/lib/warpath/client";
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
    if (body?.server) server = Number(body.server);
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
    const rows = await fetchRankingPage({ server });
    const capturedAt = new Date().toISOString();

    const snapshots = rows
      .filter((row) => row.pid)
      .map((row) => ({
        pid: String(row.pid),
        server,
        display_name: row.name ? String(row.name) : null,
        captured_at: capturedAt,
        score: row.score ?? null,
        kills: row.kills ?? null,
        deaths: row.deaths ?? null,
        rank: row.rank ?? null,
        alliance_name: row.alliance ? String(row.alliance) : null,
        raw_payload_hash: hashPayload(row),
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
      summary: `Ranking sync completed for server ${server} (${snapshots.length} records)`,
      actor_id: user.id,
      metadata: { server, records: snapshots.length },
    });

    return NextResponse.json({
      ok: true,
      server,
      records: snapshots.length,
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
