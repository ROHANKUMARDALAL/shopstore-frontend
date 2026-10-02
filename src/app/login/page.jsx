"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PasswordInput } from "@/components/password-input";
import { forgotPassword, forgotUserId, login, resetPassword } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { acceptSession } = useAuth();
  const [email, setEmail] = useState("counter@shopstore.local");
  const [password, setPassword] = useState("shopstore123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [forgotUserOpen, setForgotUserOpen] = useState(false);
  const [forgotPassOpen, setForgotPassOpen] = useState(false);

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
    <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-5 py-4 sm:py-10">
      <div className="login-modal rise-in overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/95 shadow-[0_24px_60px_-28px_rgba(28,70,40,0.45)] ring-1 ring-primary/10">
        <div className="login-modal-banner px-6 py-7 sm:px-8">
          <p className="text-xs font-semibold tracking-[0.22em] text-primary-foreground/85 uppercase">
            Fertiliser counter
          </p>
          <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
            ShopStore
          </h1>
          <p className="mt-2 max-w-sm text-base text-primary-foreground/90">
            Sign in to open the stock book — products, buy, and sell in one place.
          </p>
        </div>

        <div className="grid gap-5 px-6 py-6 sm:px-8 sm:py-7">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Sign in failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-base">
                User ID / Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10"
                  placeholder="counter@shopstore.local"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-base">
                Password
              </Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                required
              />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm">
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setForgotPassOpen(true)}
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setForgotUserOpen(true)}
                >
                  Forgot user ID?
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="mt-1 h-14 text-lg" disabled={busy}>
              {busy ? "Signing in…" : "Sign in to counter"}
            </Button>
          </form>

          <p className="text-center text-base text-muted-foreground">
            New shop?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Create a counter account
            </Link>
          </p>
        </div>
      </div>

      <ForgotUserIdDialog open={forgotUserOpen} onOpenChange={setForgotUserOpen} onFound={setEmail} />
      <ForgotPasswordDialog
        open={forgotPassOpen}
        onOpenChange={setForgotPassOpen}
        defaultEmail={email}
        onReset={(nextEmail) => {
          setEmail(nextEmail);
          setPassword("");
        }}
      />
    </div>
  );
}

function ForgotUserIdDialog({ open, onOpenChange, onFound }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMatches([]);
    try {
      const result = await forgotUserId({ name });
      setMatches(result.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find that user ID.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setName("");
          setError(null);
          setMatches([]);
        }
      }}
    >
      <DialogContent className="sm:max-w-md gap-5 p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserRound className="size-5 text-primary" />
            Forgot user ID
          </DialogTitle>
          <DialogDescription className="text-base">
            Enter the name on the counter account. We will show the matching email / user ID.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="forgot-name">Your name</Label>
            <Input
              id="forgot-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Rohan Counter"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {matches.length > 0 ? (
            <ul className="grid gap-2 rounded-xl border border-border bg-muted/40 p-3">
              {matches.map((row) => (
                <li key={row.email} className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-sm text-muted-foreground">{row.email}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onFound(row.email);
                      onOpenChange(false);
                    }}
                  >
                    Use this
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <DialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Searching…" : "Find user ID"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ForgotPasswordDialog({ open, onOpenChange, defaultEmail, onReset }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(defaultEmail || "");
  const [resetCode, setResetCode] = useState("");
  const [issuedCode, setIssuedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [doneMessage, setDoneMessage] = useState(null);

  function resetState(nextOpen) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setStep("email");
      setEmail(defaultEmail || "");
      setResetCode("");
      setIssuedCode("");
      setNewPassword("");
      setError(null);
      setDoneMessage(null);
    } else {
      setEmail(defaultEmail || "");
    }
  }

  async function requestCode(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await forgotPassword({ email });
      setIssuedCode(result.resetCode);
      setResetCode(result.resetCode);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start password reset.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await resetPassword({ email, resetCode, newPassword });
      setDoneMessage(result.message);
      onReset(email);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={resetState}>
      <DialogContent className="sm:max-w-md gap-5 p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="size-5 text-primary" />
            Forgot password
          </DialogTitle>
          <DialogDescription className="text-base">
            {step === "email"
              ? "Enter your email. We will give a one-time reset code for this counter."
              : step === "reset"
                ? "Enter the reset code and choose a new password."
                : "Your password is ready. Sign in with the new one."}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {step === "email" ? (
          <form onSubmit={requestCode} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="forgot-email">Email / user ID</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="counter@shopstore.local"
                required
              />
            </div>
            <DialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0 sm:justify-between">
              <Button type="button" variant="outline" onClick={() => resetState(false)}>
                Close
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Sending…" : "Get reset code"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}

        {step === "reset" ? (
          <form onSubmit={submitReset} className="grid gap-3">
            {issuedCode ? (
              <Alert>
                <AlertTitle>Reset code</AlertTitle>
                <AlertDescription>
                  <p>
                    Code for <span className="font-medium">{email}</span>:{" "}
                    <span className="font-semibold tracking-widest tabular-nums">{issuedCode}</span>
                  </p>
                  <p className="mt-1">Valid for 30 minutes on this shop setup.</p>
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="reset-code">6-digit code</Label>
              <Input
                id="reset-code"
                inputMode="numeric"
                value={resetCode}
                onChange={(event) => setResetCode(event.target.value)}
                placeholder="123456"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>
            <DialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0 sm:justify-between">
              <Button type="button" variant="outline" onClick={() => setStep("email")}>
                Back
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Updating…" : "Save new password"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="grid gap-3">
            <Alert>
              <AlertTitle>Password updated</AlertTitle>
              <AlertDescription>{doneMessage}</AlertDescription>
            </Alert>
            <DialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0">
              <Button type="button" className="w-full" onClick={() => resetState(false)}>
                Back to sign in
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
