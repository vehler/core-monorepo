import Link from "next/link";
import { headers } from "next/headers";
import { apiWithAuth } from "@/lib/api";
import { ApiError } from "@core/sdk";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieHeader = headers().get("cookie");
  const api = apiWithAuth(cookieHeader);

  let greeting = "Not signed in";
  try {
    const me = await api.me.get();
    greeting = `Signed in as ${me.name ?? me.email}`;
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      greeting = err instanceof ApiError ? `API error: ${err.code}` : "API unreachable";
    }
  }

  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight">core-monorepo</h1>
      <p className="text-muted-foreground max-w-prose text-center">
        Hono API + typed SDK + Next.js. Auth is wired up via{" "}
        <code className="bg-muted rounded px-1.5 py-0.5 text-sm">@core/auth</code>.
      </p>
      <p className="bg-muted rounded-md border px-4 py-2 font-mono text-sm">{greeting}</p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
