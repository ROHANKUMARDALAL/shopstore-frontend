"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const publicPaths = new Set(["/login", "/signup"]);

export function AuthGate({ children }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = publicPaths.has(pathname);

  useEffect(() => {
    if (!ready) return;
    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }
    if (user && isPublic) {
      router.replace("/");
    }
  }, [ready, user, isPublic, router]);

  if (!ready) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-4">
        <div className="page-loader-ring" aria-hidden />
        <div className="page-loader-bar" aria-hidden />
        <p className="text-sm font-light tracking-wide text-muted-foreground">Opening ShopStore…</p>
      </div>
    );
  }

  if (!user && !isPublic) return null;
  if (user && isPublic) return null;

  return children;
}
