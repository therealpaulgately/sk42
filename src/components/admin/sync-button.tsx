"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SyncButtonProps {
  defaultServer?: number;
}

export function SyncButton({ defaultServer = 63 }: SyncButtonProps) {
  const [server, setServer] = useState(String(defaultServer));
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server: Number(server) }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Sync failed");
        return;
      }

      setStatus(`Synced ${data.records} records for server ${data.server}`);
    } catch {
      setStatus("Sync request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Server
        </span>
        <select
          value={server}
          onChange={(event) => setServer(event.target.value)}
          className="h-9 rounded-md border border-input bg-muted/50 px-3 text-sm"
          disabled={loading}
        >
          <option value="42">S42</option>
          <option value="63">S63</option>
        </select>
      </label>
      <Button type="button" variant="outline" onClick={handleSync} disabled={loading}>
        {loading ? "Syncing…" : "Trigger manual sync"}
      </Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
