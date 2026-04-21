"use client";

import Link from "next/link";
import { ShoppingCart, Search } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const count = useCartStore((s) => s.count());

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-primary">
          Do&apos;kon
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            aria-label="Qidirish"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Savatcha"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
