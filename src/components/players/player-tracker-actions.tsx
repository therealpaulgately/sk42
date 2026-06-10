"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AllianceOption } from "@/lib/data/alliances";
import type { PlayerDetail } from "@/types/database";

interface PlayerTrackerActionsProps {
  player: PlayerDetail;
  alliances: AllianceOption[];
  editable: boolean;
}

type WatchlistState = PlayerDetail["watchlistState"];

export function PlayerTrackerActions({
  player,
  alliances,
  editable,
}: PlayerTrackerActionsProps) {
  const router = useRouter();
  const [isPinned, setIsPinned] = useState(player.isPinned);
  const [watchlistState, setWatchlistState] = useState<WatchlistState>(
    player.watchlistState
  );
  const [allianceName, setAllianceName] = useState(player.allianceName ?? "");
  const [discordHandle, setDiscordHandle] = useState(player.discordHandle ?? "");
  const [notes, setNotes] = useState(player.notes ?? "");
  const [tagsText, setTagsText] = useState(player.tags.join(", "));
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const allianceSuggestions = useMemo(
    () => alliances.map((alliance) => alliance.name),
    [alliances]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable) {
      setStatus("Connect Supabase write access to save changes.");
      return;
    }
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/players/${encodeURIComponent(player.pid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server: player.server,
          isPinned,
          watchlistState,
          allianceName,
            discordHandle,
          notes,
          tags: tagsText
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setStatus(data.error ?? "Unable to save player changes");
        return;
      }

      setStatus(data.message ?? "Player updated");
      router.refresh();
    } catch {
      setStatus("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Tracker actions</CardTitle>
        <Badge variant="secondary">{player.source === "demo" ? "Demo" : "Live"}</Badge>
      </CardHeader>
      <CardContent>
        {!editable ? (
          <p className="mb-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            Editing is disabled until Supabase write credentials are configured.
          </p>
        ) : null}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(event) => setIsPinned(event.target.checked)}
                className="size-4 rounded border-border bg-background"
                disabled={!editable}
              />
              <span className="text-sm">
                <span className="font-medium">Pinned</span>
                <span className="block text-xs text-muted-foreground">
                  Keep this player on the watchlist
                </span>
              </span>
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Watchlist state
              </span>
              <select
                value={watchlistState}
                onChange={(event) =>
                  setWatchlistState(event.target.value as WatchlistState)
                }
                className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={!editable}
              >
                <option value="none">None</option>
                <option value="watch">Watch</option>
                <option value="flagged">Flagged</option>
              </select>
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Alliance assignment
            </span>
            <Input
              list="alliance-options"
              value={allianceName}
              onChange={(event) => setAllianceName(event.target.value)}
              placeholder="Alliance name"
              disabled={!editable}
            />
            <datalist id="alliance-options">
              {allianceSuggestions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              Start typing an alliance name, or leave blank to clear the assignment.
            </p>
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Discord handle
            </span>
            <Input
              value={discordHandle}
              onChange={(event) => setDiscordHandle(event.target.value)}
              placeholder="@leadership_handle"
              disabled={!editable}
            />
            <p className="text-xs text-muted-foreground">
              Optional contact field for leadership coordination.
            </p>
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Operational notes, threat labels, reminders..."
              disabled={!editable}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Tags
            </span>
            <Input
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="Recruit, raid lead, watch, etc."
              disabled={!editable}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated tags. Leave blank to clear all tags.
            </p>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving || !editable}>
              {saving ? "Saving…" : "Save player changes"}
            </Button>
            {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
