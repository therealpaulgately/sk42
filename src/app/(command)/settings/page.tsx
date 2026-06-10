import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      phase="Phase 1"
      features={[
        "Preferred server selection",
        "Notification preferences",
        "Profile display name",
        "Theme preferences (dark default)",
      ]}
    />
  );
}
