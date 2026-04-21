"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/common/PriceTag";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const outOfStock = product.stockQuantity === 0;
  const hasDiscount = product.discountPrice != null;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (outOfStock) return;
    addItem(product);
    toast.success("Savatchaga qo'shildi");
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.primaryImageUrl ? (
            <Image
              src={product.primaryImageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
              📦
            </div>
          )}
          {hasDiscount && (
            <Badge className="absolute left-2 top-2 bg-red-500 text-white">
              Chegirma
            </Badge>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black">
                Tugadi
              </span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="line-clamp-2 text-sm font-medium leading-tight">
            {product.name}
          </p>
          <div className="mt-2 flex items-end justify-between gap-2">
            <PriceTag
              amount={product.discountPrice ?? product.price}
              originalAmount={hasDiscount ? product.price : undefined}
              className="text-sm"
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={outOfStock}
              onClick={handleAdd}
              aria-label="Savatga"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
