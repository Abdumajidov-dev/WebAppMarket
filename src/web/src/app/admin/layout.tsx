"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, pathname, router, hydrated]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!hydrated || !isAuthenticated) return null;

  return <AdminShell>{children}</AdminShell>;
}
