import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AlliancesPage() {
  return (
    <ModulePlaceholder
      phase="Phase 4"
      features={[
        "Alliance list for selected server",
        "Aggregate power, score, and kill metrics",
        "Trend indicators",
        "Track alliance / add to watchlist",
      ]}
    />
  );
}
