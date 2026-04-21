"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, ShoppingCart, Package } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Bosh sahifa", icon: Home },
  { href: "/catalog", label: "Katalog", icon: Grid },
  { href: "/cart", label: "Savatcha", icon: ShoppingCart },
  { href: "/orders", label: "Buyurtmalar", icon: Package },
];

export function BottomNav() {
  const pathname = usePathname();
  const count = useCartStore((s) => s.count());

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <ul className="flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const isCart = href === "/cart";
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-2 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {isCart && count > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {count}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
