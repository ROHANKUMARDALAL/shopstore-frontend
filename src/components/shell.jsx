"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { AuthGate } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/stock-in", label: "Stock in" },
  { href: "/stock-out", label: "Stock out" },
  { href: "/purchases", label: "Purchases" },
  { href: "/sales", label: "Sales" },
];

function CounterChrome({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const authScreen = pathname === "/login" || pathname === "/signup";

  if (authScreen) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-background">
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-3 md:px-8">
          <div>
            <p className="text-[11px] font-medium tracking-[0.18em] text-primary uppercase">
              Fertiliser counter
            </p>
            <p className="font-heading text-xl tracking-tight">ShopStore</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden text-right text-xs font-light text-muted-foreground sm:block">
              <p className="font-normal text-foreground">{user?.name}</p>
              <p>{user?.email}</p>
              <p className="mt-0.5 opacity-80">API {API_URL.replace("http://", "")}</p>
            </div>
            <Button type="button" variant="outline" className="h-9 text-sm font-normal" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-1.5 overflow-x-auto px-4 py-2.5 md:px-8">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-lg px-3.5 py-2 text-sm font-normal transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 md:px-8 md:py-7">{children}</main>
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
