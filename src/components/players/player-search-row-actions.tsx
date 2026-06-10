"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlayerSearchResult } from "@/types/database";

interface PlayerSearchRowActionsProps {
  player: PlayerSearchResult;
  editable: boolean;
}

type WatchlistState = PlayerSearchResult["watchlistState"];

export function PlayerSearchRowActions({
  player,
  editable,
}: PlayerSearchRowActionsProps) {
  const router = useRouter();
  const [isPinned, setIsPinned] = useState(player.isPinned);
  const [watchlistState, setWatchlistState] = useState<WatchlistState>(
    player.watchlistState
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
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
        }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setStatus(data.error ?? "Unable to save player");
        return;
      }

      setStatus(data.message ?? "Saved");
      router.refresh();
    } catch {
      setStatus("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-2" onSubmit={handleSave}>
      {!editable ? (
        <Badge variant="outline" className="inline-flex">
          Read only
        </Badge>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={isPinned ? "secondary" : "outline"}
          onClick={() => setIsPinned((current) => !current)}
          disabled={!editable}
        >
          {isPinned ? "Pinned" : "Pin"}
        </Button>
        <select
          value={watchlistState}
          onChange={(event) => setWatchlistState(event.target.value as WatchlistState)}
          className="h-9 rounded-md border border-input bg-muted/50 px-3 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={!editable}
          aria-label="Watchlist state"
        >
          <option value="none">None</option>
          <option value="watch">Watch</option>
          <option value="flagged">Flagged</option>
        </select>
        <Button type="submit" size="sm" disabled={!editable || saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      {status ? <p className="text-[11px] text-muted-foreground">{status}</p> : null}
    </form>
  );
}
