"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { AuthGate } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "/", label: "1 · Dashboard" },
  { href: "/products", label: "2 · Products" },
  { href: "/stock-in", label: "3 · Buy / Stock in" },
  { href: "/stock-out", label: "4 · Sell / Stock out" },
  { href: "/purchases", label: "Purchases" },
  { href: "/sales", label: "Sales" },
];

function CounterChrome({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const authScreen = pathname === "/login" || pathname === "/signup";

  if (authScreen) {
    return (
      <div className="relative flex min-h-full flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 app-atmosphere" aria-hidden />
        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 app-atmosphere" aria-hidden />
      <header className="relative z-40 border-b border-border/80 bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-4 pt-4 md:px-8">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-primary uppercase">
              Fertiliser counter
            </p>
            <p className="font-heading text-3xl font-semibold tracking-tight">ShopStore</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden text-right text-sm text-muted-foreground sm:block">
              <p className="font-medium text-foreground">{user?.name}</p>
              <p>{user?.email}</p>
              <p className="mt-1 text-xs">API {API_URL.replace("http://", "")}</p>
            </div>
            <Button type="button" variant="outline" className="h-11" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-3 md:px-8">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-3 text-base font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/80 text-foreground hover:bg-accent",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}

export function Shell({ children }) {
  return (
    <AuthGate>
      <CounterChrome>{children}</CounterChrome>
    </AuthGate>
  );
}
