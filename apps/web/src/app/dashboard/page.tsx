import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiWithAuth } from "@/lib/api";
import { ApiError } from "@core/sdk";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieHeader = headers().get("cookie");
  const api = apiWithAuth(cookieHeader);

  try {
    const me = await api.me.get();
    return (
      <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {me.name ?? me.email}</h1>
        <div className="bg-muted/50 rounded-md border px-4 py-3 text-sm">
          <p>
            <span className="text-muted-foreground">id:</span> <code>{me.id}</code>
          </p>
          <p>
            <span className="text-muted-foreground">email:</span> {me.email}
          </p>
          <p>
            <span className="text-muted-foreground">verified:</span>{" "}
            {me.emailVerified ? "yes" : "no"}
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          Fetched via <code className="bg-muted rounded px-1 py-0.5">api.me.get()</code> — the same
          call mobile would make.
        </p>
        <SignOutButton />
      </main>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/sign-in");
    }
    throw err;
  }
}
