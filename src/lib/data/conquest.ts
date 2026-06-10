import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SERVER } from "@/types/database";

export interface ConquestPlayerDelta {
  pid: string;
  displayName: string;
  allianceName: string | null;
  discordHandle: string | null;
  isTracked: boolean;
  isPinned: boolean;
  watchlistState: "none" | "watch" | "flagged";
  startCapturedAt: string;
  endCapturedAt: string;
  scoreStart: number | null;
  scoreEnd: number | null;
  scoreDelta: number;
  killsStart: number | null;
  killsEnd: number | null;
  killsDelta: number;
  deathsStart: number | null;
  deathsEnd: number | null;
  deathsDelta: number;
  rankStart: number | null;
  rankEnd: number | null;
  rankDelta: number;
  anomaly: boolean;
}

export interface ConquestAllianceDelta {
  allianceName: string;
  memberCount: number;
  trackedCount: number;
  scoreDelta: number;
  killsDelta: number;
  deathsDelta: number;
  anomalyCount: number;
}

export interface ConquestReport {
  server: number;
  startDate: string;
  endDate: string;
  source: "database" | "demo";
  trackedOnly: boolean;
  sort: "score" | "kills" | "deaths" | "rank";
  playerRows: ConquestPlayerDelta[];
  allianceRows: ConquestAllianceDelta[];
}

function hasSupabaseConfig() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

function toNumber(value: number | null | undefined) {
  return value ?? 0;
}

function buildDelta(
  pid: string,
  displayName: string,
  allianceName: string | null,
  discordHandle: string | null,
  isTracked: boolean,
  isPinned: boolean,
  watchlistState: "none" | "watch" | "flagged",
  start: {
    capturedAt: string;
    score: number | null;
    kills: number | null;
    deaths: number | null;
    rank: number | null;
  },
  end: {
    capturedAt: string;
    score: number | null;
    kills: number | null;
    deaths: number | null;
    rank: number | null;
  }
): ConquestPlayerDelta {
  const scoreDelta = toNumber(end.score) - toNumber(start.score);
  const killsDelta = toNumber(end.kills) - toNumber(start.kills);
  const deathsDelta = toNumber(end.deaths) - toNumber(start.deaths);
  const rankDelta =
    start.rank !== null && end.rank !== null ? start.rank - end.rank : 0;
  return {
    pid,
    displayName,
    allianceName,
    discordHandle,
    isTracked,
    isPinned,
    watchlistState,
    startCapturedAt: start.capturedAt,
    endCapturedAt: end.capturedAt,
    scoreStart: start.score,
    scoreEnd: end.score,
    scoreDelta,
    killsStart: start.kills,
    killsEnd: end.kills,
    killsDelta,
    deathsStart: start.deaths,
    deathsEnd: end.deaths,
    deathsDelta,
    rankStart: start.rank,
    rankEnd: end.rank,
    rankDelta,
    anomaly: Math.abs(scoreDelta) >= 100000 || Math.abs(rankDelta) >= 20,
  };
}

function sortRows(
  rows: ConquestPlayerDelta[],
  sort: ConquestReport["sort"]
) {
  const direction = sort === "deaths" ? -1 : 1;
  return rows.sort((a, b) => {
    if (sort === "score") return b.scoreDelta - a.scoreDelta;
    if (sort === "kills") return b.killsDelta - a.killsDelta;
    if (sort === "deaths") return b.deathsDelta - a.deathsDelta;
    if (sort === "rank") return b.rankDelta - a.rankDelta;
    return direction;
  });
}

const demoReport: ConquestReport = {
  server: DEFAULT_SERVER,
  startDate: "2026-06-03T00:00:00.000Z",
  endDate: "2026-06-10T00:00:00.000Z",
  source: "demo",
  trackedOnly: false,
  sort: "score",
  playerRows: sortRows(
    [
      buildDelta(
        "123456789",
        "Iron Fox",
        "SK42",
        "@ironfox",
        true,
        true,
        "watch",
        {
          capturedAt: "2026-06-03T00:00:00.000Z",
          score: 110000,
          kills: 7100,
          deaths: 120,
          rank: 28,
        },
        {
          capturedAt: "2026-06-10T00:00:00.000Z",
          score: 124300,
          kills: 8160,
          deaths: 142,
          rank: 14,
        }
      ),
      buildDelta(
        "246810121",
        "Night Owl",
        "SK42",
        "@nightowl",
        true,
        false,
        "none",
        {
          capturedAt: "2026-06-03T00:00:00.000Z",
          score: 98000,
          kills: 5700,
          deaths: 90,
          rank: 42,
        },
        {
          capturedAt: "2026-06-10T00:00:00.000Z",
          score: 102800,
          kills: 6012,
          deaths: 97,
          rank: 31,
        }
      ),
    ],
    "score"
  ),
  allianceRows: [
    {
      allianceName: "SK42",
      memberCount: 2,
      trackedCount: 2,
      scoreDelta: 29_100,
      killsDelta: 1_372,
      deathsDelta: 29,
      anomalyCount: 1,
    },
  ],
};

export async function getConquestReport({
  server = DEFAULT_SERVER,
  startDate,
  endDate,
  trackedOnly = false,
  sort = "score",
}: {
  server?: number;
  startDate?: string;
  endDate?: string;
  trackedOnly?: boolean;
  sort?: ConquestReport["sort"];
}): Promise<ConquestReport> {
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const normalizedStart = start.toISOString();
  const normalizedEnd = end.toISOString();

  if (!hasSupabaseConfig()) {
    return {
      ...demoReport,
      server,
      startDate: normalizedStart,
      endDate: normalizedEnd,
      trackedOnly,
      sort,
      playerRows: sortRows(
        demoReport.playerRows.filter((row) => (!trackedOnly ? true : row.isTracked)),
        sort
      ),
    };
  }

  try {
    const supabase = await createClient();
    const [snapshotsRes, trackedRes] = await Promise.all([
      supabase
        .from("player_snapshots")
        .select(
          "pid, server, display_name, captured_at, score, kills, deaths, rank, alliance_name"
        )
        .eq("server", server)
        .gte("captured_at", normalizedStart)
        .lte("captured_at", normalizedEnd)
        .order("captured_at", { ascending: true }),
      supabase
        .from("tracked_players")
        .select("pid, display_name, server, alliance_id, is_pinned, watchlist_state, discord_handle")
        .eq("server", server),
    ]);

    if (snapshotsRes.error) throw snapshotsRes.error;
    if (trackedRes.error) throw trackedRes.error;

    const trackedByPid = new Map(
      ((trackedRes.data ?? []) as Array<{
        pid: string;
        display_name: string | null;
        alliance_id: string | null;
        is_pinned: boolean;
        watchlist_state: "none" | "watch" | "flagged";
        discord_handle: string | null;
      }>).map((player) => [player.pid, player] as const)
    );

    const snapshotsByPid = new Map<
      string,
      {
        first: {
          capturedAt: string;
          score: number | null;
          kills: number | null;
          deaths: number | null;
          rank: number | null;
        };
        last: {
          capturedAt: string;
          score: number | null;
          kills: number | null;
          deaths: number | null;
          rank: number | null;
        };
        allianceName: string | null;
        displayName: string;
      }
    >();

    for (const snapshot of (snapshotsRes.data ?? []) as Array<{
      pid: string;
      display_name: string | null;
      captured_at: string;
      score: number | null;
      kills: number | null;
      deaths: number | null;
      rank: number | null;
      alliance_name: string | null;
    }>) {
      const current = snapshotsByPid.get(snapshot.pid);
      const nextPoint = {
        capturedAt: snapshot.captured_at,
        score: snapshot.score,
        kills: snapshot.kills,
        deaths: snapshot.deaths,
        rank: snapshot.rank,
      };

      if (!current) {
        snapshotsByPid.set(snapshot.pid, {
          first: nextPoint,
          last: nextPoint,
          allianceName: snapshot.alliance_name,
          displayName: snapshot.display_name ?? snapshot.pid,
        });
        continue;
      }

      if (snapshot.captured_at < current.first.capturedAt) {
        current.first = nextPoint;
      }
      if (snapshot.captured_at >= current.last.capturedAt) {
        current.last = nextPoint;
        current.allianceName = snapshot.alliance_name;
        current.displayName = snapshot.display_name ?? current.displayName;
      }
    }

    const playerRows = Array.from(snapshotsByPid.entries())
      .map(([pid, entry]) => {
        const tracked = trackedByPid.get(pid);
        const isTracked = Boolean(tracked);
        return buildDelta(
          pid,
          tracked?.display_name ?? entry.displayName,
          entry.allianceName,
          tracked?.discord_handle ?? null,
          isTracked,
          tracked?.is_pinned ?? false,
          tracked?.watchlist_state ?? "none",
          entry.first,
          entry.last
        );
      })
      .filter((row) => (!trackedOnly ? true : row.isTracked));

    const allianceMap = new Map<string, ConquestAllianceDelta>();
    for (const row of playerRows) {
      const allianceName = row.allianceName ?? "Unallied";
      const current =
        allianceMap.get(allianceName) ??
        ({
          allianceName,
          memberCount: 0,
          trackedCount: 0,
          scoreDelta: 0,
          killsDelta: 0,
          deathsDelta: 0,
          anomalyCount: 0,
        } satisfies ConquestAllianceDelta);
      current.memberCount += 1;
      current.trackedCount += row.isTracked ? 1 : 0;
      current.scoreDelta += row.scoreDelta;
      current.killsDelta += row.killsDelta;
      current.deathsDelta += row.deathsDelta;
      current.anomalyCount += row.anomaly ? 1 : 0;
      allianceMap.set(allianceName, current);
    }

    return {
      server,
      startDate: normalizedStart,
      endDate: normalizedEnd,
      source: "database",
      trackedOnly,
      sort,
      playerRows: sortRows(playerRows, sort),
      allianceRows: Array.from(allianceMap.values()).sort((a, b) => b.scoreDelta - a.scoreDelta),
    };
  } catch {
    return {
      ...demoReport,
      server,
      startDate: normalizedStart,
      endDate: normalizedEnd,
      trackedOnly,
      sort,
      playerRows: sortRows(
        demoReport.playerRows.filter((row) => (!trackedOnly ? true : row.isTracked)),
        sort
      ),
    };
  }
}
