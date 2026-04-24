"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";
import type { ApiResponse, Banner, Category, PagedResponse, Product } from "@/types";

const FALLBACK_BANNERS: Banner[] = [
  { id: "1", title: "Yangi kolleksiya", subtitle: "Qiz bolalar kiyimlari — 30% chegirma", emoji: "👗", bgGradient: "from-[#7B2FF7] to-[#4A00E0]", linkUrl: "/catalog?category=qiz-bolalar", sortOrder: 0, isActive: true },
  { id: "2", title: "Ayollar kiyimi", subtitle: "Zamonaviy va arzon narxlarda", emoji: "👚", bgGradient: "from-[#FF3B30] to-[#FF6B6B]", linkUrl: "/catalog?category=ayollar", sortOrder: 1, isActive: true },
  { id: "3", title: "Bolalar kiyimi", subtitle: "Yumshoq, sifatli materiallar", emoji: "🧒", bgGradient: "from-[#FF9500] to-[#FFCC02]", linkUrl: "/catalog", sortOrder: 2, isActive: true },
];

function HeroBanner() {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: allBanners } = useQuery({
    queryKey: ["banners"],
    queryFn: () =>
      api.get<ApiResponse<Banner[]>>("/banners?activeOnly=true").then((r) => r.data.data),
  });

  const banners = allBanners?.length ? allBanners : FALLBACK_BANNERS;

  useEffect(() => {
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % banners.length), 3500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  const b = banners[idx] ?? banners[0];
  if (!b) return null;

  const inner = (
    <div className={`bg-gradient-to-r ${b.bgGradient} px-5 py-6 transition-all duration-500`}>
      {b.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.imageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover mb-2" />
      ) : (
        <p className="text-4xl">{b.emoji || "🛍"}</p>
      )}
      <p className="mt-1 text-xl font-bold text-white">{b.title}</p>
      {b.subtitle && <p className="mt-0.5 text-sm text-white/80">{b.subtitle}</p>}
    </div>
  );

  return (
    <div className="relative mx-4 mt-3 overflow-hidden rounded-2xl">
      {b.linkUrl ? <Link href={b.linkUrl}>{inner}</Link> : inner}
      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

const CAT_FALLBACK: Record<string, string> = {
  "qiz-bolalar": "👧",
  "ogil-bolalar": "👦",
  "ayollar": "👩",
  "aksessuarlar": "💍",
  default: "🏷️",
};

function CategoryScroll() {
  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<ApiResponse<Category[]>>("/categories").then((r) => r.data.data),
  });
  const cats = data ?? [];
  if (!cats.length) return null;

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-[15px] font-bold text-gray-800">Kategoriyalar</h2>
        <Link href="/catalog" className="flex items-center gap-0.5 text-xs text-[#7B2FF7]">
          Barchasi <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-2 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {cats.map((cat) => (
          <Link
            key={cat.id}
            href={`/catalog?category=${cat.slug}`}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-[#F3EEFF] shadow-sm transition-transform active:scale-95">
              {cat.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">
                  {CAT_FALLBACK[cat.slug] ?? CAT_FALLBACK.default}
                </div>
              )}
            </div>
            <span className="w-16 text-center text-[11px] font-medium leading-tight text-gray-700">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Skeleton card ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="aspect-[3/4] animate-pulse bg-gray-200" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-7 w-full animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["products-home"],
    queryFn: () =>
      api.get<PagedResponse<Product>>("/products", { params: { pageSize: 20 } }).then((r) => r.data),
  });

  const products = data?.data ?? [];

  return (
    <div className="bg-gray-50 pb-4">
      <HeroBanner />
      <CategoryScroll />

      {/* Popular products */}
      <section className="mt-5 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-gray-800">Mashhur mahsulotlar</h2>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
