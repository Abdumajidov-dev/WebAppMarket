"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/shop/ProductCard";
import type { ApiResponse, Category, PagedResponse, Product } from "@/types";

const CAT_ICONS: Record<string, string> = {
  "qiz-bolalar": "👧",
  "ogil-bolalar": "👦",
  "ayollar": "👩",
  "aksessuarlar": "💍",
  default: "🏷️",
};

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

function CategoryGrid({
  categories,
  onSelect,
}: {
  categories: Category[];
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="px-4 pt-4">
      <h1 className="mb-4 text-[15px] font-bold text-gray-800">Kategoriyalar</h1>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.slug)}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#F3EEFF]">
              {cat.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">
                  {CAT_ICONS[cat.slug] ?? CAT_ICONS.default}
                </div>
              )}
            </div>
            <span className="text-[13px] font-semibold text-gray-800 leading-tight">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") ?? "");
  const searchQuery = searchParams.get("q") ?? "";

  useEffect(() => {
    setActiveCategory(searchParams.get("category") ?? "");
  }, [searchParams]);

  const { data: catsData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<ApiResponse<Category[]>>("/categories").then((r) => r.data.data),
  });

  const categories = catsData ?? [];
  const activeCat = categories.find((c) => c.slug === activeCategory);
  const showProducts = !!activeCategory || !!searchQuery;

  const { data, isLoading } = useQuery({
    queryKey: ["products-catalog", activeCat?.id, searchQuery],
    queryFn: () =>
      api
        .get<PagedResponse<Product>>("/products", {
          params: {
            pageSize: 40,
            ...(activeCat?.id ? { categoryId: activeCat.id } : {}),
            ...(searchQuery ? { search: searchQuery } : {}),
          },
        })
        .then((r) => r.data),
    enabled: showProducts,
  });

  const products = data?.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Category pills sub-header — only when category is active */}
      {activeCategory && categories.length > 0 && (
        <div className="sticky top-14 z-40 bg-[#7B2FF7] px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCategory("")}
              className="shrink-0 rounded-full bg-white/20 p-1.5 text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 text-xs font-medium transition-colors ${
                  activeCategory === cat.slug ? "bg-white text-[#7B2FF7]" : "bg-white/20 text-white"
                }`}
              >
                <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-white/30">
                  {cat.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px]">
                      {CAT_ICONS[cat.slug] ?? CAT_ICONS.default}
                    </span>
                  )}
                </span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {!showProducts ? (
        categories.length === 0 ? (
          <div className="px-4 pt-4 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
        ) : (
          <CategoryGrid categories={categories} onSelect={setActiveCategory} />
        )
      ) : (
        <div className="px-4 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-[15px] font-bold text-gray-800">
              {activeCat?.name ?? (searchQuery ? `"${searchQuery}"` : "Natijalar")}
            </h1>
            {!isLoading && (
              <span className="text-xs text-gray-400">{products.length} ta</span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <span className="text-5xl">🔍</span>
              <p className="mt-3 font-semibold text-gray-700">Mahsulot topilmadi</p>
              <p className="mt-1 text-sm text-gray-400">Boshqa kalit so&apos;z yoki kategoriya tanlang</p>
              <button
                onClick={() => setActiveCategory("")}
                className="mt-4 rounded-xl bg-[#7B2FF7] px-5 py-2 text-sm font-medium text-white"
              >
                Kategoriyalarga qaytish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="px-4 pt-4 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
