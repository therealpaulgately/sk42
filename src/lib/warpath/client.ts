/**
 * Warpath external data client.
 * Phase 2: server-side ingestion only — never call from the browser UI.
 */

const RANKING_ENDPOINT =
  process.env.WARPATH_RANKING_URL ??
  "https://yx.dmzgame.com/intl_warpath/rank_pid";

export interface RankingRequest {
  server: number;
  page?: number;
  pageSize?: number;
}

export interface RawRankingRow {
  pid: string;
  name?: string;
  score?: number;
  kills?: number;
  deaths?: number;
  rank?: number;
  alliance?: string;
  [key: string]: unknown;
}

export async function fetchRankingPage(
  params: RankingRequest
): Promise<RawRankingRow[]> {
  const url = new URL(RANKING_ENDPOINT);
  url.searchParams.set("server", String(params.server));
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.pageSize) url.searchParams.set("size", String(params.pageSize));

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Ranking fetch failed: ${response.status}`);
  }

  const payload = await response.json();

  if (Array.isArray(payload)) return payload as RawRankingRow[];
  if (Array.isArray(payload?.data)) return payload.data as RawRankingRow[];
  if (Array.isArray(payload?.list)) return payload.list as RawRankingRow[];

  return [];
}

export function hashPayload(payload: unknown): string {
  const str = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}
