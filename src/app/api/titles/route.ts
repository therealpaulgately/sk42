import { NextResponse } from "next/server";
import { hasMinimumRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SERVER } from "@/types/database";

export async function POST(request: Request) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Supabase is not configured for write operations" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to load profile", detail: profileError.message },
      { status: 500 }
    );
  }

  if (!hasMinimumRole(profile?.role, "leader")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    pid?: string;
    pids?: string[];
    server?: number;
    title?: string;
    notes?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const pid = (body.pid ?? "").trim();
  const pids = Array.from(
    new Set(
      [
        ...(Array.isArray(body.pids) ? body.pids : []),
        pid,
      ]
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
  const title = (body.title ?? "").trim();
  const notes = body.notes !== undefined && body.notes !== null ? String(body.notes).trim() : null;
  const server = Number(body.server) || DEFAULT_SERVER;

  if (pids.length === 0 || !title) {
    return NextResponse.json(
      { error: "PID and title are required" },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Config error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const now = new Date().toISOString();
  for (const currentPid of pids) {
    const { data: trackedPlayer, error: trackedError } = await admin
      .from("tracked_players")
      .upsert(
        {
          pid: currentPid,
          server,
          display_name: currentPid,
          is_pinned: false,
          watchlist_state: "none",
        },
        { onConflict: "pid,server" }
      )
      .select("id, pid, display_name")
      .single();

    if (trackedError) {
      return NextResponse.json(
        { error: "Failed to load tracked player", detail: trackedError.message },
        { status: 500 }
      );
    }

    const { error: closeError } = await admin
      .from("player_titles")
      .update({ effective_until: now })
      .eq("tracked_player_id", trackedPlayer.id)
      .is("effective_until", null);

    if (closeError) {
      return NextResponse.json(
        { error: "Failed to close previous titles", detail: closeError.message },
        { status: 500 }
      );
    }

    const { error: insertError } = await admin.from("player_titles").insert({
      tracked_player_id: trackedPlayer.id,
      title,
      assigned_by: user.id,
      effective_from: now,
      effective_until: null,
      notes,
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to assign title", detail: insertError.message },
        { status: 500 }
      );
    }
  }

  await admin.from("activity_events").insert({
    event_type: "title_assigned",
    summary: `${title} assigned to ${pids.length} player${pids.length === 1 ? "" : "s"} on S${server}`,
    actor_id: user.id,
    metadata: {
      pids,
      server,
      title,
      notes,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Title assigned",
  });
}
