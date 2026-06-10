"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SyncButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/sync", { method: "POST" });
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
      <Button type="button" variant="outline" onClick={handleSync} disabled={loading}>
        {loading ? "Syncing…" : "Trigger manual sync"}
      </Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
