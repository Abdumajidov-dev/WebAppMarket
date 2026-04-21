"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { QuantitySelector } from "@/components/shop/QuantitySelector";
import { PriceTag } from "@/components/common/PriceTag";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg font-medium">Savat bo&apos;sh</p>
        <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
          Xarid qilishni boshlash
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="mb-4 text-xl font-bold">Savat</h1>
      <div className="flex flex-col gap-3">
        {items.map(({ product, quantity }) => (
          <div
            key={product.id}
            className="flex gap-3 rounded-xl border bg-card p-3"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              {product.primaryImageUrl ? (
                <Image
                  src={product.primaryImageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl">
                  📦
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <p className="line-clamp-2 text-sm font-medium leading-tight">
                {product.name}
              </p>
              <PriceTag
                amount={product.discountPrice ?? product.price}
                className="text-sm"
              />
              <div className="flex items-center justify-between">
                <QuantitySelector
                  value={quantity}
                  max={product.stockQuantity}
                  onChange={(q) => updateQuantity(product.id, q)}
                />
                <button
                  onClick={() => removeItem(product.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
                  aria-label="O'chirish"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between text-base">
          <span className="text-muted-foreground">Jami:</span>
          <span className="text-lg font-bold">
            <PriceTag amount={total()} />
          </span>
        </div>
        <Link
          href="/checkout"
          className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full")}
        >
          Buyurtma berish
        </Link>
      </div>
    </div>
  );
}
