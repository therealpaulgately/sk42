import type { UserRole } from "@/lib/auth/roles";

export interface Profile {
  id: string;
  discord_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  preferred_server: number | null;
  created_at: string;
  updated_at: string;
}

export interface TrackedPlayer {
  id: string;
  pid: string;
  display_name: string | null;
  server: number;
  alliance_id: string | null;
  is_pinned: boolean;
  watchlist_state: "none" | "watch" | "flagged";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerSnapshot {
  id: string;
  pid: string;
  server: number;
  display_name: string | null;
  captured_at: string;
  score: number | null;
  kills: number | null;
  deaths: number | null;
  rank: number | null;
  alliance_name: string | null;
  raw_payload_hash: string | null;
  created_at: string;
}

export interface Alliance {
  id: string;
  name: string;
  server: number;
  is_tracked: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncRun {
  id: string;
  job_type: "ranking" | "player_detail" | "full";
  server: number | null;
  status: "pending" | "running" | "success" | "failed";
  started_at: string;
  finished_at: string | null;
  records_processed: number;
  error_message: string | null;
}

export interface ActivityEvent {
  id: string;
  event_type: string;
  summary: string;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DashboardMetrics {
  trackedPlayersCount: number;
  trackedAlliancesCount: number;
  selectedServer: number;
  lastSyncAt: string | null;
  significantChangesCount: number;
  flaggedPlayersCount: number;
}

export interface WatchlistMover {
  pid: string;
  displayName: string;
  scoreDelta: number;
  killsDelta: number;
  deathsDelta: number;
  rankDelta: number;
  allianceChanged: boolean;
}

export type PlayerSearchSource = "database" | "demo";

export interface PlayerSearchResult {
  pid: string;
  displayName: string;
  server: number;
  allianceName: string | null;
  isPinned: boolean;
  watchlistState: "none" | "watch" | "flagged";
  notes: string | null;
  latestSnapshotAt: string | null;
  score: number | null;
  kills: number | null;
  deaths: number | null;
  rank: number | null;
  source: PlayerSearchSource;
}

export interface PlayerDetail {
  pid: string;
  displayName: string;
  server: number;
  allianceName: string | null;
  isPinned: boolean;
  watchlistState: "none" | "watch" | "flagged";
  notes: string | null;
  latestSnapshotAt: string | null;
  source: PlayerSearchSource;
  snapshots: PlayerSnapshot[];
}

export interface SyncRunSummary {
  id: string;
  job_type: SyncRun["job_type"];
  server: number | null;
  status: SyncRun["status"];
  started_at: string;
  finished_at: string | null;
  records_processed: number;
  error_message: string | null;
}

export const DEFAULT_SERVER = 42;
