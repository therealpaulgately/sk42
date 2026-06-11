import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchAllRankingPages,
  hashPayload,
  type RawRankingRow,
} from "@/lib/warpath/client";
import { DEFAULT_SERVER } from "@/types/database";

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
    };

    const parts = [candidate.message, candidate.details, candidate.hint]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);

    if (parts.length > 0) {
      return parts.join(" - ");
    }
  }

  return "Unknown error";
}

function normalizeKills(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    const total = value.reduce((sum, entry) => {
      const numeric = typeof entry === "number" ? entry : Number(entry);
      return Number.isFinite(numeric) ? sum + numeric : sum;
    }, 0);

    return total > 0 ? total : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
}

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
    const { pages } = await fetchAllRankingPages({ server, pageSize: 500, maxPages: 25 });
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
      kills: normalizeKills(row.kills),
      deaths: row.deaths ?? null,
      rank: row.rank ?? null,
      alliance_name: row.alliance ? String(row.alliance) : null,
      raw_payload: { page, row },
      raw_payload_hash: hashPayload({ page, row }),
    }));

    if (snapshots.length > 0) {
      const batchSize = 100;
      for (let index = 0; index < snapshots.length; index += batchSize) {
        const batch = snapshots.slice(index, index + batchSize);
        const { error: insertError } = await admin
          .from("player_snapshots")
          .insert(batch);

        if (insertError) {
          throw new Error(formatError(insertError));
        }
      }
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
    const message = formatError(error);

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
