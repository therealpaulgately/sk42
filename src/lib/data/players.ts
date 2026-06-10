import { createClient } from "@/lib/supabase/server";
import type {
  PlayerDetail,
  PlayerSearchResult,
  PlayerSearchSource,
  PlayerSnapshot,
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
          (player.allianceName ?? "").toLowerCase().includes(term))
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
      .select("pid, display_name, server, alliance_id, is_pinned, watchlist_state, notes")
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
      isPinned: demo.isPinned,
      watchlistState: demo.watchlistState,
      notes: demo.notes,
      latestSnapshotAt: demo.latestSnapshotAt,
      source: "demo",
      snapshots: demoSnapshots.filter(
        (snapshot) => snapshot.pid === demo.pid && snapshot.server === server
      ),
    };
  }

  try {
    const supabase = await createClient();
    const [trackedRes, snapshotRes] = await Promise.all([
      supabase
        .from("tracked_players")
        .select("pid, display_name, server, is_pinned, watchlist_state, notes")
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
          "pid" | "display_name" | "server" | "is_pinned" | "watchlist_state" | "notes"
        >
      | null;

    if (!tracked && snapshots.length === 0) {
      return null;
    }

    const latest = snapshots[0];

    return {
      pid: normalizedPid,
      displayName: tracked?.display_name ?? latest?.display_name ?? normalizedPid,
      server,
      allianceName: latest?.alliance_name ?? null,
      isPinned: tracked?.is_pinned ?? false,
      watchlistState: tracked?.watchlist_state ?? "none",
      notes: tracked?.notes ?? null,
      latestSnapshotAt: latest?.captured_at ?? null,
      source: "database",
      snapshots,
    };
  } catch {
    return null;
  }
}

export function getDemoPlayers() {
  return demoPlayers;
}
