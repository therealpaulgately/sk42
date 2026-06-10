"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COMMON_TITLES = [
  "Leader",
  "R4",
  "Officer",
  "Diplomat",
  "Recruiter",
  "Strategist",
];

export function BulkTitleAssignmentForm() {
  const router = useRouter();
  const [pids, setPids] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [server, setServer] = useState("42");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pids: pids
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          title,
          notes,
          server: Number(server),
        }),
      });

      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus(data.error ?? "Failed to assign titles");
        return;
      }

      setStatus(data.message ?? "Titles assigned");
      setPids("");
      setTitle("");
      setNotes("");
      router.refresh();
    } catch {
      setStatus("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
      <Input
        value={pids}
        onChange={(event) => setPids(event.target.value)}
        placeholder="Comma-separated PIDs"
      />
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Title"
        list="common-title-options"
      />
      <Input
        value={server}
        onChange={(event) => setServer(event.target.value)}
        placeholder="Server"
      />
      <Input
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Notes"
      />
      <datalist id="common-title-options">
        {COMMON_TITLES.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Assigning…" : "Assign titles"}
        </Button>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </div>
    </form>
  );
}
