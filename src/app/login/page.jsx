"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { acceptSession } = useAuth();
  const [email, setEmail] = useState("counter@shopstore.local");
  const [password, setPassword] = useState("shopstore123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await login({ email, password });
      acceptSession(session);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-lg gap-6 py-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold tracking-[0.18em] text-primary uppercase">
          ShopStore
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Counter sign in
        </h1>
        <p className="text-lg text-muted-foreground">
          Open the fertiliser stock book. Demo login is already filled —
          change it when you create your own account.
        </p>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Sign in failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-base">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password" className="text-base">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <Button type="submit" size="lg" className="h-14 text-lg" disabled={busy}>
          {busy ? "Signing in…" : "Sign in to counter"}
        </Button>
      </form>

      <p className="text-base text-muted-foreground">
        New shop?{" "}
        <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
          Create a counter account
        </Link>
      </p>
    </div>
  );
}
