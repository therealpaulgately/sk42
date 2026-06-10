import { NextResponse } from "next/server";
import { hasMinimumRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SERVER } from "@/types/database";

const WATCHLIST_STATES = new Set(["none", "watch", "flagged"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pid: string }> }
) {
  const { pid } = await params;

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

  if (!hasMinimumRole(profile?.role, "officer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    server?: number;
    isPinned?: boolean;
    watchlistState?: string;
    allianceName?: string | null;
    discordHandle?: string | null;
    notes?: string | null;
    tags?: string[];
  };

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const server = Number(body.server) || DEFAULT_SERVER;
  const isPinned = Boolean(body.isPinned);
  const watchlistState = WATCHLIST_STATES.has(body.watchlistState ?? "")
    ? (body.watchlistState as "none" | "watch" | "flagged")
    : "none";
  const hasAllianceName = Object.prototype.hasOwnProperty.call(body, "allianceName");
  const hasDiscordHandle = Object.prototype.hasOwnProperty.call(body, "discordHandle");
  const hasNotes = Object.prototype.hasOwnProperty.call(body, "notes");
  const hasTags = Object.prototype.hasOwnProperty.call(body, "tags");
  const allianceName =
    hasAllianceName && body.allianceName !== null
      ? String(body.allianceName).trim()
      : undefined;
  const discordHandle =
    hasDiscordHandle && body.discordHandle !== null
      ? String(body.discordHandle).trim()
      : undefined;
  const notes =
    hasNotes && body.notes !== null ? String(body.notes).trim() : undefined;
  const tags = hasTags
    ? Array.from(
        new Set(
          (body.tags ?? [])
            .map((tag) => String(tag).trim())
            .filter(Boolean)
        )
      )
    : undefined;

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Config error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: existing, error: existingError } = await admin
    .from("tracked_players")
    .select(
      "id, pid, server, display_name, alliance_id, discord_handle, is_pinned, watchlist_state, notes"
    )
    .eq("pid", pid)
    .eq("server", server)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: "Failed to load tracked player", detail: existingError.message },
      { status: 500 }
    );
  }

  let allianceId: string | null = null;
  if (allianceName !== undefined && allianceName) {
    const { data: alliance, error: allianceError } = await admin
      .from("alliances")
      .upsert(
        {
          name: allianceName,
          server,
          is_tracked: true,
        },
        { onConflict: "name,server" }
      )
      .select("id")
      .single();

    if (allianceError) {
      return NextResponse.json(
        { error: "Failed to save alliance", detail: allianceError.message },
        { status: 500 }
      );
    }

    allianceId = alliance.id;
  }

  const nextDisplayName = existing?.display_name ?? pid;
  const previousState = existing
    ? {
        isPinned: existing.is_pinned,
        watchlistState: existing.watchlist_state,
        allianceId: existing.alliance_id,
        discordHandle: existing.discord_handle,
        notes: existing.notes,
      }
    : null;

  const { error: upsertError } = await admin.from("tracked_players").upsert(
    {
      pid,
      server,
      display_name: nextDisplayName,
      alliance_id: allianceName !== undefined ? allianceId : existing?.alliance_id ?? null,
      discord_handle:
        discordHandle !== undefined ? discordHandle : existing?.discord_handle ?? null,
      is_pinned: isPinned,
      watchlist_state: watchlistState,
      notes: notes !== undefined ? (notes || null) : existing?.notes ?? null,
    },
    { onConflict: "pid,server" }
  );

  if (upsertError) {
    return NextResponse.json(
      { error: "Failed to save player", detail: upsertError.message },
      { status: 500 }
    );
  }

  let trackedPlayerId = existing?.id ?? null;
  if (!trackedPlayerId || hasTags) {
    const { data: refreshedTracked, error: refreshError } = await admin
      .from("tracked_players")
      .select("id")
      .eq("pid", pid)
      .eq("server", server)
      .maybeSingle();

    if (refreshError) {
      return NextResponse.json(
        { error: "Failed to refresh player", detail: refreshError.message },
        { status: 500 }
      );
    }

    trackedPlayerId = refreshedTracked?.id ?? null;
  }

  if (hasTags && trackedPlayerId) {
    const nextTags = tags ?? [];
    const { data: currentTags, error: currentTagsError } = await admin
      .from("player_tags")
      .select("tag")
      .eq("tracked_player_id", trackedPlayerId);

    if (currentTagsError) {
      return NextResponse.json(
        { error: "Failed to load tags", detail: currentTagsError.message },
        { status: 500 }
      );
    }

    const currentTagSet = new Set((currentTags ?? []).map((row) => row.tag));
    const nextTagSet = new Set(nextTags);

    const tagsToDelete = Array.from(currentTagSet).filter(
      (tag) => !nextTagSet.has(tag)
    );
    const tagsToInsert = Array.from(nextTagSet).filter(
      (tag) => !currentTagSet.has(tag)
    );

    if (tagsToDelete.length > 0) {
      const { error: deleteError } = await admin
        .from("player_tags")
        .delete()
        .eq("tracked_player_id", trackedPlayerId)
        .in("tag", tagsToDelete);

      if (deleteError) {
        return NextResponse.json(
          { error: "Failed to remove tags", detail: deleteError.message },
          { status: 500 }
        );
      }
    }

    if (tagsToInsert.length > 0) {
      const { error: insertError } = await admin.from("player_tags").insert(
        tagsToInsert.map((tag) => ({
          tracked_player_id: trackedPlayerId,
          tag,
          created_by: user.id,
        }))
      );

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to add tags", detail: insertError.message },
          { status: 500 }
        );
      }
    }
  }

  const changes: string[] = [];
  if (!previousState || previousState.isPinned !== isPinned) {
    changes.push(isPinned ? "pinned" : "unpinned");
  }
  if (!previousState || previousState.watchlistState !== watchlistState) {
    changes.push(`watchlist set to ${watchlistState}`);
  }
  if (allianceName !== undefined && (!previousState || previousState.allianceId !== allianceId)) {
    changes.push(allianceId ? `assigned to ${allianceName}` : "cleared alliance assignment");
  }
  if (notes !== undefined && (!previousState || previousState.notes !== (notes || null))) {
    changes.push(notes ? "notes updated" : "notes cleared");
  }
  if (
    discordHandle !== undefined &&
    (!previousState || previousState.discordHandle !== (discordHandle || null))
  ) {
    changes.push(discordHandle ? "discord handle updated" : "discord handle cleared");
  }
  if (hasTags) {
    changes.push("tags updated");
  }

  await admin.from("activity_events").insert({
    event_type: "player_updated",
    summary: `Player ${pid} ${changes.length ? changes.join(", ") : "updated"} on server S${server}`,
    actor_id: user.id,
    metadata: {
      pid,
      server,
      isPinned,
      watchlistState,
      allianceName: allianceName ?? null,
        discordHandle: discordHandle ?? null,
        tags: tags ?? null,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Player saved",
    player: {
      pid,
      server,
      displayName: nextDisplayName,
      isPinned,
      watchlistState,
      allianceName: allianceName ?? null,
      discordHandle: discordHandle ?? existing?.discord_handle ?? null,
      notes: notes ?? existing?.notes ?? null,
      tags: tags ?? [],
    },
  });
}
