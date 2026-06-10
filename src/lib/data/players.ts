import { createClient } from "@/lib/supabase/server";
import type {
  ActivityEvent,
  PlayerDetail,
  PlayerSearchResult,
  PlayerSearchSource,
  PlayerSnapshot,
  PlayerTag,
  TrackedPlayer,
} from "@/types/database";
import { DEFAULT_SERVER } from "@/types/database";

const hasSupabaseConfig =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const demoSnapshots: PlayerSnapshot[] = [
  {
    id: "demo-snap-1",
    pid: "123456789",
    server: 42,
    display_name: "Iron Fox",
    captured_at: "2026-06-10T18:30:00.000Z",
    score: 124300,
    kills: 8160,
    deaths: 142,
    rank: 14,
    alliance_name: "SK42",
    raw_payload_hash: "demo-a",
    created_at: "2026-06-10T18:30:00.000Z",
  },
  {
    id: "demo-snap-2",
    pid: "123456789",
    server: 42,
    display_name: "Iron Fox",
    captured_at: "2026-06-09T18:30:00.000Z",
    score: 121900,
    kills: 8008,
    deaths: 138,
    rank: 15,
    alliance_name: "SK42",
    raw_payload_hash: "demo-b",
    created_at: "2026-06-09T18:30:00.000Z",
  },
  {
    id: "demo-snap-3",
    pid: "246810121",
    server: 42,
    display_name: "Night Owl",
    captured_at: "2026-06-10T18:15:00.000Z",
    score: 102800,
    kills: 6012,
    deaths: 97,
    rank: 31,
    alliance_name: "SK42",
    raw_payload_hash: "demo-c",
    created_at: "2026-06-10T18:15:00.000Z",
  },
  {
    id: "demo-snap-4",
    pid: "99887766",
    server: 42,
    display_name: "General K",
    captured_at: "2026-06-10T18:05:00.000Z",
    score: 140700,
    kills: 9550,
    deaths: 201,
    rank: 8,
    alliance_name: "Raven",
    raw_payload_hash: "demo-d",
    created_at: "2026-06-10T18:05:00.000Z",
  },
];

const demoPlayers: PlayerSearchResult[] = [
  {
    pid: "123456789",
    displayName: "Iron Fox",
    server: 42,
    allianceName: "SK42",
    discordHandle: "@ironfox",
    isPinned: true,
    watchlistState: "watch",
    notes: "Frequent mover",
    latestSnapshotAt: "2026-06-10T18:30:00.000Z",
    score: 124300,
    kills: 8160,
    deaths: 142,
    rank: 14,
    source: "demo",
  },
  {
    pid: "246810121",
    displayName: "Night Owl",
    server: 42,
    allianceName: "SK42",
    discordHandle: "@nightowl",
    isPinned: false,
    watchlistState: "none",
    notes: null,
    latestSnapshotAt: "2026-06-10T18:15:00.000Z",
    score: 102800,
    kills: 6012,
    deaths: 97,
    rank: 31,
    source: "demo",
  },
  {
    pid: "99887766",
    displayName: "General K",
    server: 42,
    allianceName: "Raven",
    discordHandle: "@generalk",
    isPinned: false,
    watchlistState: "flagged",
    notes: "Watch for alliance swap",
    latestSnapshotAt: "2026-06-10T18:05:00.000Z",
    score: 140700,
    kills: 9550,
    deaths: 201,
    rank: 8,
    source: "demo",
  },
];

function cleanQuery(value: string) {
  return value.trim();
}

function buildPlayerSearchResult(
  pid: string,
  server: number,
  displayName: string | null,
  latestSnapshotAt: string | null,
  score: number | null,
  kills: number | null,
  deaths: number | null,
  rank: number | null,
  allianceName: string | null,
  discordHandle: string | null,
  isPinned: boolean,
  watchlistState: "none" | "watch" | "flagged",
  notes: string | null,
  source: PlayerSearchSource
): PlayerSearchResult {
  return {
    pid,
    displayName: displayName ?? pid,
    server,
    allianceName,
    discordHandle,
    isPinned,
    watchlistState,
    notes,
    latestSnapshotAt,
    score,
    kills,
    deaths,
    rank,
    source,
  };
}

function mergeResults(
  snapshots: Array<{
    pid: string;
    server: number;
    display_name: string | null;
    captured_at: string;
    score: number | null;
    kills: number | null;
    deaths: number | null;
    rank: number | null;
    alliance_name: string | null;
  }>,
  trackedPlayers: TrackedPlayer[]
): PlayerSearchResult[] {
  const trackedByPid = new Map(
    trackedPlayers.map((player) => [player.pid, player] as const)
  );
  const rows = new Map<string, PlayerSearchResult>();

  for (const row of snapshots) {
    const tracked = trackedByPid.get(row.pid);
    const existing = rows.get(row.pid);
    const result = buildPlayerSearchResult(
      row.pid,
      row.server,
      tracked?.display_name ?? row.display_name,
      row.captured_at,
      row.score,
      row.kills,
      row.deaths,
      row.rank,
      row.alliance_name,
      tracked?.discord_handle ?? null,
      tracked?.is_pinned ?? false,
      tracked?.watchlist_state ?? "none",
      tracked?.notes ?? null,
      "database"
    );

    if (!existing || new Date(result.latestSnapshotAt ?? 0) > new Date(existing.latestSnapshotAt ?? 0)) {
      rows.set(row.pid, result);
    }
  }

  for (const tracked of trackedPlayers) {
    if (rows.has(tracked.pid)) {
      const current = rows.get(tracked.pid)!;
      rows.set(
        tracked.pid,
        {
          ...current,
          displayName: tracked.display_name ?? current.displayName,
          discordHandle: tracked.discord_handle,
          isPinned: tracked.is_pinned,
          watchlistState: tracked.watchlist_state,
          notes: tracked.notes,
          source: "database",
        }
      );
      continue;
    }

    rows.set(
      tracked.pid,
      buildPlayerSearchResult(
        tracked.pid,
        tracked.server,
        tracked.display_name,
        null,
        null,
        null,
        null,
        null,
        null,
        tracked.discord_handle,
        tracked.is_pinned,
        tracked.watchlist_state,
        tracked.notes,
        "database"
      )
    );
  }

  return Array.from(rows.values()).sort((a, b) => {
    if (a.latestSnapshotAt && b.latestSnapshotAt) {
      return b.latestSnapshotAt.localeCompare(a.latestSnapshotAt);
    }
    if (a.latestSnapshotAt) return -1;
    if (b.latestSnapshotAt) return 1;
    return a.displayName.localeCompare(b.displayName);
  });
}

function filterDemo(query: string, server: number): PlayerSearchResult[] {
  const term = query.toLowerCase();
  return demoPlayers
    .filter(
      (player) =>
        player.server === server &&
        (!term ||
          player.pid.includes(term) ||
          player.displayName.toLowerCase().includes(term) ||
          (player.allianceName ?? "").toLowerCase().includes(term) ||
          (player.discordHandle ?? "").toLowerCase().includes(term))
    )
    .slice(0, 25);
}

export async function searchPlayers({
  query,
  server = DEFAULT_SERVER,
  limit = 25,
}: {
  query?: string;
  server?: number;
  limit?: number;
}): Promise<{ players: PlayerSearchResult[]; source: PlayerSearchSource }> {
  const term = cleanQuery(query ?? "");

  if (!hasSupabaseConfig) {
    return { players: filterDemo(term, server).slice(0, limit), source: "demo" };
  }

  try {
    const supabase = await createClient();
    const searchPattern = term ? `%${term.replace(/[%,]/g, "")}%` : "%";
    const baseQuery = supabase
      .from("player_snapshots")
      .select(
        "pid, server, display_name, captured_at, score, kills, deaths, rank, alliance_name"
      )
      .eq("server", server)
      .order("captured_at", { ascending: false })
      .limit(term ? 100 : 50);

    const trackedQuery = supabase
      .from("tracked_players")
      .select(
        "pid, display_name, server, alliance_id, discord_handle, is_pinned, watchlist_state, notes"
      )
      .eq("server", server)
      .limit(term ? 50 : 25);

    const [snapshotRes, trackedRes] = await Promise.all([
      term
        ? baseQuery.or(
            `pid.ilike.${searchPattern},display_name.ilike.${searchPattern}`
          )
        : baseQuery,
      term
        ? trackedQuery.or(
            `pid.ilike.${searchPattern},display_name.ilike.${searchPattern}`
          )
        : trackedQuery,
    ]);

    if (snapshotRes.error) throw snapshotRes.error;
    if (trackedRes.error) throw trackedRes.error;

    const players = mergeResults(
      (snapshotRes.data ?? []) as Array<{
        pid: string;
        server: number;
        display_name: string | null;
        captured_at: string;
        score: number | null;
        kills: number | null;
        deaths: number | null;
        rank: number | null;
        alliance_name: string | null;
      }>,
      (trackedRes.data ?? []) as TrackedPlayer[]
    ).slice(0, limit);

    if (players.length > 0) {
      return { players, source: "database" };
    }
  } catch {
    // Fall through to demo data in local/dev mode.
  }

  return { players: filterDemo(term, server).slice(0, limit), source: "demo" };
}

export async function getPlayerDetail({
  pid,
  server = DEFAULT_SERVER,
}: {
  pid: string;
  server?: number;
}): Promise<PlayerDetail | null> {
  const normalizedPid = cleanQuery(pid);

  if (!hasSupabaseConfig) {
    const demo = demoPlayers.find(
      (player) => player.pid === normalizedPid && player.server === server
    );
    if (!demo) return null;

    return {
      pid: demo.pid,
      displayName: demo.displayName,
      server: demo.server,
      allianceName: demo.allianceName,
      discordHandle: demo.discordHandle ?? "@demo",
      isPinned: demo.isPinned,
      watchlistState: demo.watchlistState,
      notes: demo.notes,
      tags: ["demo", "sample"],
      latestSnapshotAt: demo.latestSnapshotAt,
      source: "demo",
      snapshots: demoSnapshots.filter(
        (snapshot) => snapshot.pid === demo.pid && snapshot.server === server
      ),
      activity: [],
    };
  }

  try {
    const supabase = await createClient();
    const [trackedRes, snapshotRes] = await Promise.all([
      supabase
        .from("tracked_players")
        .select(
          "id, pid, display_name, server, is_pinned, watchlist_state, notes, alliance_id, discord_handle"
        )
        .eq("pid", normalizedPid)
        .eq("server", server)
        .maybeSingle(),
      supabase
        .from("player_snapshots")
        .select(
          "pid, server, display_name, captured_at, score, kills, deaths, rank, alliance_name, raw_payload_hash, created_at"
        )
        .eq("pid", normalizedPid)
        .eq("server", server)
        .order("captured_at", { ascending: false })
        .limit(20),
    ]);

    if (trackedRes.error) throw trackedRes.error;
    if (snapshotRes.error) throw snapshotRes.error;

    const snapshots = (snapshotRes.data ?? []) as PlayerSnapshot[];
    const tracked = trackedRes.data as
      | Pick<
          TrackedPlayer,
          | "id"
          | "pid"
          | "display_name"
          | "server"
          | "is_pinned"
          | "watchlist_state"
          | "notes"
          | "alliance_id"
          | "discord_handle"
        >
      | null;

    if (!tracked && snapshots.length === 0) {
      return null;
    }

    const latest = snapshots[0];
    let allianceName = latest?.alliance_name ?? null;
    let tags: string[] = [];
    if (tracked?.alliance_id) {
      const { data: alliance } = await supabase
        .from("alliances")
        .select("name")
        .eq("id", tracked.alliance_id)
        .maybeSingle();
      allianceName = alliance?.name ?? allianceName;
    }

    if (tracked?.id) {
      const { data: tagRows } = await supabase
        .from("player_tags")
        .select("id, tracked_player_id, tag, created_by, created_at")
        .eq("tracked_player_id", tracked.id)
        .order("tag", { ascending: true });
      tags = ((tagRows ?? []) as PlayerTag[]).map((row) => row.tag);
    }

    const { data: recentActivity } = await supabase
      .from("activity_events")
      .select("id, event_type, summary, actor_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(25);
    const activity = ((recentActivity ?? []) as ActivityEvent[]).filter(
      (event) => (event.metadata as { pid?: string } | null | undefined)?.pid === normalizedPid
    );

    return {
      pid: normalizedPid,
      displayName: tracked?.display_name ?? latest?.display_name ?? normalizedPid,
      server,
      allianceName,
      discordHandle: tracked?.discord_handle ?? null,
      isPinned: tracked?.is_pinned ?? false,
      watchlistState: tracked?.watchlist_state ?? "none",
      notes: tracked?.notes ?? null,
      tags,
      latestSnapshotAt: latest?.captured_at ?? null,
      source: "database",
      snapshots,
      activity,
    };
  } catch {
    return null;
  }
}

export function getDemoPlayers() {
  return demoPlayers;
}
