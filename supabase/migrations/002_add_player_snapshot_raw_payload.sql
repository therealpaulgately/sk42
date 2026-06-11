-- Preserve the original ranking row payload for troubleshooting and reprocessing.
alter table public.player_snapshots
  add column if not exists raw_payload jsonb;
