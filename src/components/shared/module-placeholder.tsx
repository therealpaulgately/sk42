import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModulePlaceholderProps {
  phase: string;
  features: string[];
}

export function ModulePlaceholder({ phase, features }: ModulePlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Module scaffold ready</CardTitle>
          <Badge variant="secondary">{phase}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Navigation, layout, and database schema are in place. Next implementation
          steps for this module:
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
