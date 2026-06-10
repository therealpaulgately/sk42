import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function ConquestPage() {
  return (
    <ModulePlaceholder
      phase="Phase 5"
      features={[
        "Date window selection",
        "Delta computation from stored snapshots",
        "Tracked-only and alliance filters",
        "Export to CSV",
        "Saved report presets",
      ]}
    />
  );
}
