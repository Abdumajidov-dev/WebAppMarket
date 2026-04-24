"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function ShopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <BottomNav />
    </>
  );
}
