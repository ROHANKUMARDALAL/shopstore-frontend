"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/stock-in", label: "Stock in" },
  { href: "/stock-out", label: "Stock out" },
  { href: "/purchases", label: "Purchases" },
  { href: "/sales", label: "Sales" },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-end justify-between gap-4 px-4 pt-4 md:px-8">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Fertiliser counter
            </p>
            <p className="text-2xl font-semibold tracking-tight">ShopStore</p>
          </div>
          <p className="hidden text-right text-sm text-muted-foreground sm:block">
            Stock only
            <br />
            No GST, no ledger
          </p>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-3 md:px-8">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-full px-4 py-3 text-base font-semibold",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
