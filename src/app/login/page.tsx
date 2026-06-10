import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  async function signInWithDiscord() {
    "use server";
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) throw error;
    if (data.url) {
      const { redirect } = await import("next/navigation");
      redirect(data.url);
    }
  }

  async function signInWithGoogle() {
    "use server";
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) throw error;
    if (data.url) {
      const { redirect } = await import("next/navigation");
      redirect(data.url);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <span className="text-sm font-bold tracking-widest">SK42</span>
          </div>
          <CardTitle className="text-xl">Command Center</CardTitle>
          <CardDescription>
            Sign in to access Savage Kings intelligence tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error ? (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              Authentication failed. Please try again.
            </p>
          ) : null}

          {!supabaseConfigured ? (
            <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              Supabase is not configured yet. Copy <code className="text-data">.env.example</code> to{" "}
              <code className="text-data">.env.local</code> or set{" "}
              <code className="text-data">NEXT_PUBLIC_DEV_SKIP_AUTH=true</code> for local UI preview.
            </p>
          ) : null}

          <form action={signInWithDiscord}>
            <Button type="submit" className="w-full" disabled={!supabaseConfigured}>
              Continue with Discord
            </Button>
          </form>

          <form action={signInWithGoogle}>
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={!supabaseConfigured}
            >
              Continue with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
