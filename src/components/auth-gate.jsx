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
      <div className="flex min-h-full flex-1 items-center justify-center px-4">
        <p className="text-2xl font-semibold tracking-tight">Opening ShopStore…</p>
      </div>
    );
  }

  if (!user && !isPublic) return null;
  if (user && isPublic) return null;

  return children;
}
