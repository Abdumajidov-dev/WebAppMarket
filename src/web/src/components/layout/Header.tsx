"use client";

import Link from "next/link";
import { ShoppingCart, Search } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const count = useCartStore((s) => s.count());
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  useEffect(() => setMounted(true), []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-50 bg-[#7B2FF7] shadow-md">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link href="/" className="shrink-0 text-lg font-bold text-white">
          Do&apos;kon
        </Link>

        <form onSubmit={handleSearch} className="flex flex-1 items-center rounded-xl bg-white/20 px-3 py-1.5 gap-2">
          <Search className="h-4 w-4 shrink-0 text-white/80" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mahsulot qidiring..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/70 outline-none"
          />
        </form>

        <Link href="/cart" aria-label="Savatcha" className="relative shrink-0 p-1">
          <ShoppingCart className="h-6 w-6 text-white" />
          {mounted && count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF3B30] text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
