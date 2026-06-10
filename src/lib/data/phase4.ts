import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SERVER } from "@/types/database";

export interface AllianceTopMember {
  pid: string;
  displayName: string;
  score: number | null;
  kills: number | null;
  rank: number | null;
  isPinned: boolean;
}

export interface AllianceSummary {
  id: string;
  name: string;
  server: number;
  isTracked: boolean;
  notes: string | null;
  memberCount: number;
  pinnedCount: number;
  watchlistCount: number;
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
  latestSnapshotAt: string | null;
  topMembers: AllianceTopMember[];
}

export interface LeadershipEntry {
  id: string;
  pid: string;
  displayName: string;
  allianceName: string | null;
  discordHandle: string | null;
  title: string | null;
  isPinned: boolean;
  watchlistState: "none" | "watch" | "flagged";
  latestSnapshotAt: string | null;
  tags: string[];
}

export interface TitleHistoryRow {
  id: string;
  pid: string;
  displayName: string;
  title: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  notes: string | null;
}

function hasSupabaseConfig() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

const demoAllianceSummaries: AllianceSummary[] = [
  {
    id: "demo-alliance-1",
    name: "SK42",
    server: DEFAULT_SERVER,
    isTracked: true,
    notes: "Core alliance",
    memberCount: 12,
    pinnedCount: 5,
    watchlistCount: 3,
    totalScore: 1_482_000,
    totalKills: 91_220,
    totalDeaths: 1_604,
    latestSnapshotAt: "2026-06-10T18:30:00.000Z",
    topMembers: [
      {
        pid: "123456789",
        displayName: "Iron Fox",
        score: 124300,
        kills: 8160,
        rank: 14,
        isPinned: true,
      },
      {
        pid: "246810121",
        displayName: "Night Owl",
        score: 102800,
        kills: 6012,
        rank: 31,
        isPinned: false,
      },
    ],
  },
  {
    id: "demo-alliance-2",
    name: "Raven",
    server: DEFAULT_SERVER,
    isTracked: false,
    notes: "Neighbor alliance",
    memberCount: 7,
    pinnedCount: 1,
    watchlistCount: 2,
    totalScore: 931_400,
    totalKills: 61_500,
    totalDeaths: 832,
    latestSnapshotAt: "2026-06-10T18:05:00.000Z",
    topMembers: [
      {
        pid: "99887766",
        displayName: "General K",
        score: 140700,
        kills: 9550,
        rank: 8,
        isPinned: false,
      },
    ],
  },
];

const demoLeadership: LeadershipEntry[] = [
  {
    id: "demo-1",
    pid: "123456789",
    displayName: "Iron Fox",
    allianceName: "SK42",
    discordHandle: "@ironfox",
    title: "Leader",
    isPinned: true,
    watchlistState: "watch",
    latestSnapshotAt: "2026-06-10T18:30:00.000Z",
    tags: ["demo", "sample"],
  },
  {
    id: "demo-2",
    pid: "246810121",
    displayName: "Night Owl",
    allianceName: "SK42",
    discordHandle: "@nightowl",
    title: "Officer",
    isPinned: false,
    watchlistState: "none",
    latestSnapshotAt: "2026-06-10T18:15:00.000Z",
    tags: ["recon"],
  },
];

const demoTitleHistory: TitleHistoryRow[] = [
  {
    id: "title-demo-1",
    pid: "123456789",
    displayName: "Iron Fox",
    title: "Leader",
    effectiveFrom: "2026-06-01T12:00:00.000Z",
    effectiveUntil: null,
    notes: "Founding leader",
  },
  {
    id: "title-demo-2",
    pid: "246810121",
    displayName: "Night Owl",
    title: "Officer",
    effectiveFrom: "2026-06-04T12:00:00.000Z",
    effectiveUntil: null,
    notes: "Ops coverage",
  },
];

function buildLatestSnapshotMap(
  snapshots: Array<{
    pid: string;
    display_name: string | null;
    captured_at: string;
    score: number | null;
    kills: number | null;
    deaths: number | null;
    rank: number | null;
    alliance_name: string | null;
  }>
) {
  const map = new Map<
    string,
    {
      pid: string;
      displayName: string;
      capturedAt: string;
      score: number | null;
      kills: number | null;
      deaths: number | null;
      rank: number | null;
      allianceName: string | null;
    }
  >();

  for (const snapshot of snapshots) {
    const existing = map.get(snapshot.pid);
    if (!existing || snapshot.captured_at > existing.capturedAt) {
      map.set(snapshot.pid, {
        pid: snapshot.pid,
        displayName: snapshot.display_name ?? snapshot.pid,
        capturedAt: snapshot.captured_at,
        score: snapshot.score,
        kills: snapshot.kills,
        deaths: snapshot.deaths,
        rank: snapshot.rank,
        allianceName: snapshot.alliance_name,
      });
    }
  }

  return map;
}

export async function getAllianceSummaries(
  server = DEFAULT_SERVER
): Promise<{ summaries: AllianceSummary[]; source: "database" | "demo" }> {
  if (!hasSupabaseConfig()) {
    return { summaries: demoAllianceSummaries.filter((alliance) => alliance.server === server), source: "demo" };
  }

  try {
    const supabase = await createClient();
    const [alliancesRes, playersRes, snapshotsRes] = await Promise.all([
      supabase
        .from("alliances")
        .select("id, name, server, is_tracked, notes")
        .eq("server", server)
        .order("name", { ascending: true }),
      supabase
        .from("tracked_players")
        .select("id, pid, display_name, server, alliance_id, is_pinned, watchlist_state, notes")
        .eq("server", server),
      supabase
        .from("player_snapshots")
        .select("pid, display_name, captured_at, score, kills, deaths, rank, alliance_name")
        .eq("server", server)
        .order("captured_at", { ascending: false })
        .limit(500),
    ]);

    if (alliancesRes.error) throw alliancesRes.error;
    if (playersRes.error) throw playersRes.error;
    if (snapshotsRes.error) throw snapshotsRes.error;

    const latestByPid = buildLatestSnapshotMap(
      (snapshotsRes.data ?? []) as Array<{
        pid: string;
        display_name: string | null;
        captured_at: string;
        score: number | null;
        kills: number | null;
        deaths: number | null;
        rank: number | null;
        alliance_name: string | null;
      }>
    );

    const players = (playersRes.data ?? []) as Array<{
      id: string;
      pid: string;
      display_name: string | null;
      alliance_id: string | null;
      is_pinned: boolean;
      watchlist_state: "none" | "watch" | "flagged";
      notes: string | null;
    }>;

    const summaries = (alliancesRes.data ?? []).map((alliance) => {
      const members = players.filter((player) => player.alliance_id === alliance.id);
      const memberSnapshots = members
        .map((member) => latestByPid.get(member.pid))
        .filter((snapshot): snapshot is NonNullable<typeof snapshot> => Boolean(snapshot));

      const topMembers = memberSnapshots
        .map((snapshot) => {
          const tracked = members.find((member) => member.pid === snapshot.pid);
          return {
            pid: snapshot.pid,
            displayName: snapshot.displayName,
            score: snapshot.score,
            kills: snapshot.kills,
            rank: snapshot.rank,
            isPinned: tracked?.is_pinned ?? false,
          };
        })
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 3);

      return {
        id: alliance.id,
        name: alliance.name,
        server: alliance.server,
        isTracked: alliance.is_tracked,
        notes: alliance.notes,
        memberCount: members.length,
        pinnedCount: members.filter((member) => member.is_pinned).length,
        watchlistCount: members.filter((member) => member.watchlist_state !== "none").length,
        totalScore: memberSnapshots.reduce((sum, snapshot) => sum + (snapshot.score ?? 0), 0),
        totalKills: memberSnapshots.reduce((sum, snapshot) => sum + (snapshot.kills ?? 0), 0),
        totalDeaths: memberSnapshots.reduce((sum, snapshot) => sum + (snapshot.deaths ?? 0), 0),
        latestSnapshotAt:
          memberSnapshots.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0]?.capturedAt ??
          null,
        topMembers,
      } satisfies AllianceSummary;
    });

    return { summaries, source: "database" };
  } catch {
    return { summaries: demoAllianceSummaries.filter((alliance) => alliance.server === server), source: "demo" };
  }
}

export async function getAllianceComparison({
  server = DEFAULT_SERVER,
  leftAllianceId,
  rightAllianceId,
}: {
  server?: number;
  leftAllianceId?: string;
  rightAllianceId?: string;
}): Promise<{
  summaries: AllianceSummary[];
  left: AllianceSummary | null;
  right: AllianceSummary | null;
  source: "database" | "demo";
}> {
  const { summaries, source } = await getAllianceSummaries(server);
  const left = leftAllianceId
    ? summaries.find((summary) => summary.id === leftAllianceId) ?? null
    : summaries[0] ?? null;
  const right = rightAllianceId
    ? summaries.find((summary) => summary.id === rightAllianceId) ?? null
    : summaries[1] ?? null;
  return { summaries, left, right, source };
}

export async function getLeadershipRoster(
  server = DEFAULT_SERVER
): Promise<{ roster: LeadershipEntry[]; source: "database" | "demo" }> {
  if (!hasSupabaseConfig()) {
    return { roster: demoLeadership, source: "demo" };
  }

  try {
    const supabase = await createClient();
    const [playersRes, snapshotsRes, titlesRes, tagsRes, alliancesRes] = await Promise.all([
      supabase
        .from("tracked_players")
        .select(
          "id, pid, display_name, alliance_id, discord_handle, is_pinned, watchlist_state, server"
        )
        .eq("server", server),
      supabase
        .from("player_snapshots")
        .select("pid, display_name, captured_at")
        .eq("server", server)
        .order("captured_at", { ascending: false })
        .limit(500),
      supabase
        .from("player_titles")
        .select("id, tracked_player_id, title, effective_from, effective_until, notes")
        .order("effective_from", { ascending: false }),
      supabase
        .from("player_tags")
        .select("tracked_player_id, tag, created_at")
        .order("tag", { ascending: true }),
      supabase
        .from("alliances")
        .select("id, name")
        .eq("server", server),
    ]);

    if (playersRes.error) throw playersRes.error;
    if (snapshotsRes.error) throw snapshotsRes.error;
    if (titlesRes.error) throw titlesRes.error;
    if (tagsRes.error) throw tagsRes.error;
    if (alliancesRes.error) throw alliancesRes.error;

    const latestByPid = buildLatestSnapshotMap(
      (snapshotsRes.data ?? []) as Array<{
        pid: string;
        display_name: string | null;
        captured_at: string;
        score: number | null;
        kills: number | null;
        deaths: number | null;
        rank: number | null;
        alliance_name: string | null;
      }>
    );

    const currentTitleByPlayerId = new Map<string, string>();
    const activeTitles = (titlesRes.data ?? []) as Array<{
      tracked_player_id: string;
      title: string;
      effective_from: string;
      effective_until: string | null;
    }>;
    for (const title of activeTitles) {
      if (title.effective_until && new Date(title.effective_until) < new Date()) {
        continue;
      }
      if (!currentTitleByPlayerId.has(title.tracked_player_id)) {
        currentTitleByPlayerId.set(title.tracked_player_id, title.title);
      }
    }

    const tagsByPlayerId = new Map<string, string[]>();
    for (const tagRow of (tagsRes.data ?? []) as Array<{
      tracked_player_id: string;
      tag: string;
      created_at: string;
    }>) {
      const existing = tagsByPlayerId.get(tagRow.tracked_player_id) ?? [];
      existing.push(tagRow.tag);
      tagsByPlayerId.set(tagRow.tracked_player_id, existing);
    }

    const allianceById = new Map(
      ((alliancesRes.data ?? []) as Array<{ id: string; name: string }>).map(
        (alliance) => [alliance.id, alliance.name] as const
      )
    );

    const roster = ((playersRes.data ?? []) as Array<{
      id: string;
      pid: string;
      display_name: string | null;
      alliance_id: string | null;
      discord_handle: string | null;
      is_pinned: boolean;
      watchlist_state: "none" | "watch" | "flagged";
    }>).map((player) => {
      const latest = latestByPid.get(player.pid);
      return {
        id: player.id,
        pid: player.pid,
        displayName: player.display_name ?? latest?.displayName ?? player.pid,
        allianceName: player.alliance_id ? allianceById.get(player.alliance_id) ?? null : latest?.allianceName ?? null,
        discordHandle: player.discord_handle,
        title: currentTitleByPlayerId.get(player.id) ?? null,
        isPinned: player.is_pinned,
        watchlistState: player.watchlist_state,
        latestSnapshotAt: latest?.capturedAt ?? null,
        tags: tagsByPlayerId.get(player.id) ?? [],
      };
    });

    return {
      roster: roster.sort((a, b) => {
        if (a.title && b.title && a.title !== b.title) return a.title.localeCompare(b.title);
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return a.displayName.localeCompare(b.displayName);
      }),
      source: "database",
    };
  } catch {
    return { roster: demoLeadership, source: "demo" };
  }
}

export async function getTitleHistory(
  server = DEFAULT_SERVER
): Promise<{ history: TitleHistoryRow[]; missingTitleCount: number; source: "database" | "demo" }> {
  if (!hasSupabaseConfig()) {
    return { history: demoTitleHistory, missingTitleCount: 1, source: "demo" };
  }

  try {
    const supabase = await createClient();
    const [titlesRes, playersRes] = await Promise.all([
      supabase
        .from("player_titles")
        .select("id, tracked_player_id, title, effective_from, effective_until, notes")
        .order("effective_from", { ascending: false }),
      supabase
        .from("tracked_players")
        .select("id, pid, display_name, server")
        .eq("server", server),
    ]);

    if (titlesRes.error) throw titlesRes.error;
    if (playersRes.error) throw playersRes.error;

    const playersById = new Map(
      ((playersRes.data ?? []) as Array<{ id: string; pid: string; display_name: string | null }>).map(
        (player) => [player.id, player] as const
      )
    );

    const history = ((titlesRes.data ?? []) as Array<{
      id: string;
      tracked_player_id: string;
      title: string;
      effective_from: string;
      effective_until: string | null;
      notes: string | null;
    }>).map((row) => {
      const player = playersById.get(row.tracked_player_id);
      return {
        id: row.id,
        pid: player?.pid ?? row.tracked_player_id,
        displayName: player?.display_name ?? row.tracked_player_id,
        title: row.title,
        effectiveFrom: row.effective_from,
        effectiveUntil: row.effective_until,
        notes: row.notes,
      };
    });

    const titledPlayerIds = new Set(history.map((row) => row.pid));
    const missingTitleCount = ((playersRes.data ?? []) as Array<{ pid: string }>).filter(
      (player) => !titledPlayerIds.has(player.pid)
    ).length;

    return { history, missingTitleCount, source: "database" };
  } catch {
    return { history: demoTitleHistory, missingTitleCount: 1, source: "demo" };
  }
}
