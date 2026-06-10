import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function ServerMovementPage() {
  return (
    <ModulePlaceholder
      phase="Phase 3"
      features={[
        "Server selector (1–200+)",
        "Persist selected server per user/session",
        "Default filter for ranking and player workflows",
        "Recent tracked activity for active server",
      ]}
    />
  );
}
