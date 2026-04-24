"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderOpen,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { ApiResponse } from "@/types";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Buyurtmalar", icon: ShoppingBag },
  { href: "/admin/products", label: "Mahsulotlar", icon: Package },
  { href: "/admin/categories", label: "Kategoriyalar", icon: FolderOpen },
  { href: "/admin/banners", label: "Bannerlar", icon: Image },
  { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: shopData } = useQuery({
    queryKey: ["shop-settings"],
    queryFn: () =>
      api.get<ApiResponse<{ shopName: string; telegramUsername?: string }>>("/shop/settings")
        .then((r) => r.data.data),
  });

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    setUser(null);
    router.push("/admin/login");
    toast.success("Chiqildi");
  }

  const NavLinks = () => (
    <>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center gap-3 border-b px-4">
          {shopData?.telegramUsername ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://unavatar.io/telegram/${shopData.telegramUsername}`}
              alt=""
              className="h-8 w-8 rounded-full object-cover shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">🏪</div>
          )}
          <span className="truncate font-bold text-primary text-sm">
            {shopData?.shopName ?? "Admin"}
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavLinks />
        </nav>
        <div className="border-t p-3 space-y-1">
          {user && (
            <p className="truncate px-3 py-1 text-xs text-muted-foreground">
              {user.phone}
            </p>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "w-full justify-start gap-3 text-muted-foreground"
            )}
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r bg-card transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            {shopData?.telegramUsername ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://unavatar.io/telegram/${shopData.telegramUsername}`}
                alt=""
                className="h-7 w-7 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : null}
            <span className="font-bold text-primary text-sm">{shopData?.shopName ?? "Admin"}</span>
          </div>
          <button onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavLinks />
        </nav>
        <div className="border-t p-3">
          <button
            onClick={handleLogout}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "w-full justify-start gap-3 text-muted-foreground"
            )}
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center border-b bg-card px-4 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="mr-3">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-primary">Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
