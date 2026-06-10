import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function TitlesPage() {
  return (
    <ModulePlaceholder
      phase="Phase 4"
      features={[
        "Assign titles to tracked players",
        "Title types: Leader, R4, Officer, Diplomat, etc.",
        "Filter by title / missing title",
        "Title history view",
      ]}
    />
  );
}
