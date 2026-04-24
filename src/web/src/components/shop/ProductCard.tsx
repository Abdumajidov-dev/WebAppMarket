"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types";
import { toast } from "sonner";

function formatPrice(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}

function discount(price: number, discountPrice: number) {
  return Math.round(((price - discountPrice) / price) * 100);
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const outOfStock = product.stockQuantity === 0;
  const hasDiscount = product.discountPrice != null && product.discountPrice > 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (outOfStock) return;
    addItem(product);
    toast.success("Savatchaga qo'shildi");
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md active:scale-[0.98]">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          {product.primaryImageUrl ? (
            <Image
              src={product.primaryImageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">👗</div>
          )}

          {hasDiscount && (
            <span className="absolute left-2 top-2 rounded-lg bg-[#FF3B30] px-2 py-0.5 text-[11px] font-bold text-white">
              -{discount(product.price, product.discountPrice!)}%
            </span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700">
                Tugadi
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5">
          <p className="line-clamp-2 h-[2.625rem] text-[13px] font-medium leading-snug text-gray-800">
            {product.name}
          </p>

          <div className="mt-2 flex items-end justify-between gap-1">
            <div>
              <p className="text-[15px] font-bold text-[#7B2FF7]">
                {formatPrice(product.discountPrice ?? product.price)}
              </p>
              {hasDiscount && (
                <p className="text-[11px] text-gray-400 line-through">
                  {formatPrice(product.price)}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAdd}
              aria-label="Savatga"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#7B2FF7] text-white transition-opacity disabled:opacity-40 active:opacity-70"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
