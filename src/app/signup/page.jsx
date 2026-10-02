"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { signup } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { acceptSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await signup({ name, email, password });
      acceptSession(session);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
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
          Create counter account
        </h1>
        <p className="text-lg text-muted-foreground">
          One signup for the shop counter. After this you can add products, buy
          stock in, and sell stock out from the same browser.
        </p>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Signup failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
        <div className="grid gap-2">
          <Label htmlFor="name" className="text-base">
            Your name
          </Label>
          <Input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Rohan Counter"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-base">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="rohan@shop.example"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password" className="text-base">
            Password
          </Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            required
          />
        </div>
        <Button type="submit" size="lg" className="h-14 text-lg" disabled={busy}>
          {busy ? "Creating account…" : "Create account and open counter"}
        </Button>
      </form>

      <p className="text-base text-muted-foreground">
        Already on the book?{" "}
        <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
