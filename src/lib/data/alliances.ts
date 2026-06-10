import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SERVER } from "@/types/database";

export interface AllianceOption {
  id: string;
  name: string;
  server: number;
}

const demoAllianceOptions: AllianceOption[] = [
  { id: "demo-alliance-1", name: "SK42", server: DEFAULT_SERVER },
  { id: "demo-alliance-2", name: "Raven", server: DEFAULT_SERVER },
  { id: "demo-alliance-3", name: "Wolves", server: DEFAULT_SERVER },
];

function hasSupabaseConfig() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export async function getAllianceOptions(
  server = DEFAULT_SERVER
): Promise<AllianceOption[]> {
  if (!hasSupabaseConfig()) {
    return demoAllianceOptions.filter((alliance) => alliance.server === server);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("alliances")
      .select("id, name, server")
      .eq("server", server)
      .order("name", { ascending: true });

    if (error) throw error;

    return (data ?? []) as AllianceOption[];
  } catch {
    return demoAllianceOptions.filter((alliance) => alliance.server === server);
  }
}
