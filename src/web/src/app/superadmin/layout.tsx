"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSuperAdminStore } from "@/store/superadmin";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSuperAdminStore((s) => s.isAuthenticated());
  const logout = useSuperAdminStore((s) => s.logout);
  const user = useSuperAdminStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated && pathname !== "/superadmin/login") {
      router.replace("/superadmin/login");
    }
  }, [isAuthenticated, pathname, router, hydrated]);

  if (pathname === "/superadmin/login") {
    return <>{children}</>;
  }

  if (!hydrated || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="w-56 shrink-0 border-r bg-background flex flex-col">
        <div className="px-4 py-5 border-b">
          <p className="font-bold text-sm">UzMarket</p>
          <p className="text-xs text-muted-foreground">SuperAdmin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <a
            href="/superadmin/dashboard"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Dashboard
          </a>
          <a
            href="/superadmin/tenants"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Do&apos;konlar
          </a>
        </nav>
        <div className="p-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">{user?.phone}</p>
          <button
            onClick={() => { logout(); router.push("/superadmin/login"); }}
            className="w-full rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
          >
            Chiqish
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
