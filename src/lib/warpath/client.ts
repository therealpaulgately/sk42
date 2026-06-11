/**
 * Warpath external data client.
 * Phase 2: server-side ingestion only — never call from the browser UI.
 */

const RANKING_ENDPOINT =
  process.env.WARPATH_RANKING_URL ??
  "https://yx.dmzgame.com/intl_warpath/rank_pid";

const RANKING_LATEST_DAY_ENDPOINT =
  process.env.WARPATH_LATEST_DAY_URL ??
  "https://yx.dmzgame.com/intl_warpath/latest_day";

export interface RankingRequest {
  server: number;
  rank?: string;
  day?: number;
  ccid?: number;
  isBenfu?: number;
  isQuanfu?: number;
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

export interface RankingPageResult {
  payload: unknown;
  rows: RawRankingRow[];
}

export interface RankingPageRecord extends RankingPageResult {
  page: number;
}

export async function fetchLatestRankingDay(server: number): Promise<number> {
  const url = new URL(RANKING_LATEST_DAY_ENDPOINT);
  url.searchParams.set("wid", String(server));

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Latest day fetch failed: ${response.status}`);
  }

  const payload = await response.json();
  const latestDay = Number(payload?.Data ?? payload?.data);

  if (!Number.isInteger(latestDay) || latestDay <= 0) {
    throw new Error("Latest day response was empty");
  }

  return latestDay;
}

export interface CommanderHistoryRow {
  id: number;
  day: number;
  pid: number | string;
  wid: number;
  cid?: number;
  ccid?: number;
  gid?: number;
  gnick?: string;
  lv?: number;
  nick?: string;
  power?: number;
  maxpower?: number;
  sumkill?: number;
  score?: number;
  die?: number;
  caiji?: number;
  gx?: number;
  bz?: number;
  c_power?: number;
  c_die?: number;
  c_score?: number;
  c_sumkill?: number;
  c_caiji?: number;
  powers?: Record<string, unknown>;
  kills?: number[];
  created_at?: string;
  [key: string]: unknown;
}

export async function fetchRankingPage(
  params: RankingRequest
): Promise<RankingPageResult> {
  const url = new URL(RANKING_ENDPOINT);
  url.searchParams.set("wid", String(params.server));
  url.searchParams.set("rank", params.rank ?? "power");
  url.searchParams.set("ccid", String(params.ccid ?? 0));
  url.searchParams.set("is_benfu", String(params.isBenfu ?? 1));
  url.searchParams.set("is_quanfu", String(params.isQuanfu ?? 0));
  if (params.day) url.searchParams.set("day", String(params.day));
  if (params.page) url.searchParams.set("page", String(params.page));
  url.searchParams.set("perPage", String(params.pageSize ?? 500));

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Ranking fetch failed: ${response.status}`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.Data)
      ? payload.Data
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.list)
        ? payload.list
        : [];

  return {
    payload,
    rows: rows as RawRankingRow[],
  };
}

export async function fetchAllRankingPages(
  params: RankingRequest & { maxPages?: number }
): Promise<{
  pages: RankingPageRecord[];
  rows: RawRankingRow[];
}> {
  const pageSize = params.pageSize ?? 500;
  const maxPages = params.maxPages ?? 25;
  const day = params.day ?? (await fetchLatestRankingDay(params.server));
  const pages: RankingPageRecord[] = [];
  const rows: RawRankingRow[] = [];

  for (let page = params.page ?? 1; page <= maxPages; page += 1) {
    const result = await fetchRankingPage({
      server: params.server,
      rank: params.rank ?? "power",
      day,
      ccid: params.ccid ?? 0,
      isBenfu: params.isBenfu ?? 1,
      isQuanfu: params.isQuanfu ?? 0,
      page,
      pageSize,
    });
    pages.push({ page, ...result });
    rows.push(...result.rows);

    if (result.rows.length < pageSize) {
      break;
    }
  }

  return { pages, rows };
}

export async function fetchCommanderHistory({
  pid,
  server,
}: {
  pid: string;
  server?: number;
}): Promise<CommanderHistoryRow[]> {
  const url = new URL(
    process.env.WARPATH_PID_DETAIL_URL ??
      "https://yx.dmzgame.com/intl_warpath/pid_detail"
  );
  url.searchParams.set("pid", pid);
  if (server) url.searchParams.set("server", String(server));

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Commander history fetch failed: ${response.status}`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload?.Data)
    ? payload.Data
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  return rows as CommanderHistoryRow[];
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
