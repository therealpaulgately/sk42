import { DEFAULT_SERVER } from "@/types/database";
import type {
  ActivityEvent,
  DashboardMetrics,
  WatchlistMover,
} from "@/types/database";
import { createClient } from "@/lib/supabase/server";

const PLACEHOLDER_METRICS: DashboardMetrics = {
  trackedPlayersCount: 0,
  trackedAlliancesCount: 0,
  selectedServer: DEFAULT_SERVER,
  lastSyncAt: null,
  significantChangesCount: 0,
  flaggedPlayersCount: 0,
};

export async function getDashboardData(): Promise<{
  metrics: DashboardMetrics;
  activity: ActivityEvent[];
  movers: WatchlistMover[];
}> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { metrics: PLACEHOLDER_METRICS, activity: [], movers: [] };
  }

  try {
    const supabase = await createClient();

    const [
      { count: trackedPlayersCount },
      { count: trackedAlliancesCount },
      { count: flaggedPlayersCount },
      { data: lastSync },
      { data: activity },
    ] = await Promise.all([
      supabase
        .from("tracked_players")
        .select("*", { count: "exact", head: true })
        .eq("is_pinned", true),
      supabase
        .from("alliances")
        .select("*", { count: "exact", head: true })
        .eq("is_tracked", true),
      supabase
        .from("tracked_players")
        .select("*", { count: "exact", head: true })
        .eq("watchlist_state", "flagged"),
      supabase
        .from("sync_runs")
        .select("finished_at")
        .eq("status", "success")
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("activity_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let selectedServer = DEFAULT_SERVER;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_server")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.preferred_server) {
        selectedServer = profile.preferred_server;
      }
    }

    return {
      metrics: {
        trackedPlayersCount: trackedPlayersCount ?? 0,
        trackedAlliancesCount: trackedAlliancesCount ?? 0,
        selectedServer,
        lastSyncAt: lastSync?.finished_at ?? null,
        significantChangesCount: 0,
        flaggedPlayersCount: flaggedPlayersCount ?? 0,
      },
      activity: (activity ?? []) as ActivityEvent[],
      movers: [],
    };
  } catch {
    return { metrics: PLACEHOLDER_METRICS, activity: [], movers: [] };
  }
}
