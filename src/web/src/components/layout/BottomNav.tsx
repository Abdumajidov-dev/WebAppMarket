"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Grid2x2, ShoppingCart, Package } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Bosh sahifa", icon: Home },
  { href: "/catalog", label: "Katalog", icon: Grid2x2 },
  { href: "/cart", label: "Savatcha", icon: ShoppingCart },
  { href: "/orders", label: "Buyurtmalar", icon: Package },
];

export function BottomNav() {
  const pathname = usePathname();
  const count = useCartStore((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden">
      <ul className="flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/catalog" && pathname.startsWith("/catalog"));
          const isCart = href === "/cart";
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-[#7B2FF7]" : "text-gray-400"
                )}
              >
                <span className="relative">
                  <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
                  {mounted && isCart && count > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF3B30] text-[9px] font-bold text-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span className={active ? "font-semibold" : ""}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
