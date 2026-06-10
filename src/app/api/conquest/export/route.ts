import { NextResponse } from "next/server";
import { DEFAULT_SERVER } from "@/types/database";
import { getConquestReport } from "@/lib/data/conquest";

function csvEscape(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const server = Number(url.searchParams.get("server")) || DEFAULT_SERVER;
  const startDate = url.searchParams.get("startDate") ?? undefined;
  const endDate = url.searchParams.get("endDate") ?? undefined;
  const trackedOnly = url.searchParams.get("trackedOnly") === "1";
  const sort = (url.searchParams.get("sort") ?? "score") as "score" | "kills" | "deaths" | "rank";

  const report = await getConquestReport({
    server,
    startDate,
    endDate,
    trackedOnly,
    sort,
  });

  const header = [
    "pid",
    "displayName",
    "allianceName",
    "discordHandle",
    "isTracked",
    "isPinned",
    "watchlistState",
    "scoreDelta",
    "killsDelta",
    "deathsDelta",
    "rankDelta",
    "anomaly",
  ];

  const rows = report.playerRows.map((row) =>
    [
      row.pid,
      row.displayName,
      row.allianceName ?? "",
      row.discordHandle ?? "",
      row.isTracked,
      row.isPinned,
      row.watchlistState,
      row.scoreDelta,
      row.killsDelta,
      row.deathsDelta,
      row.rankDelta,
      row.anomaly,
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = [header.map(csvEscape).join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="conquest-report-s${server}.csv"`,
    },
  });
}
