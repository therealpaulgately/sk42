import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function CompareAlliancesPage() {
  return (
    <ModulePlaceholder
      phase="Phase 4"
      features={[
        "Select two or more alliances",
        "Side-by-side aggregate stats",
        "Top tracked member comparison",
        "Delta tables and export",
      ]}
    />
  );
}
