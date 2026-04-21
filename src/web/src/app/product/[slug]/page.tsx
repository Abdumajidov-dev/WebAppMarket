"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import { ImageGallery } from "@/components/shop/ImageGallery";
import { QuantitySelector } from "@/components/shop/QuantitySelector";
import { PriceTag } from "@/components/common/PriceTag";
import { ErrorState } from "@/components/common/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse, ProductDetail } from "@/types";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["product", slug],
    queryFn: () =>
      api
        .get<ApiResponse<ProductDetail>>(`/products/${slug}`)
        .then((r) => r.data.data),
  });

  function handleAdd() {
    if (!data) return;
    addItem(data, qty);
    toast.success(`${data.name} savatchaga qo'shildi`);
  }

  if (isLoading) return <ProductPageSkeleton />;
  if (error || !data)
    return <ErrorState message="Mahsulot topilmadi" onRetry={refetch} />;

  const outOfStock = data.stockQuantity === 0;
  const hasDiscount = data.discountPrice != null;

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gallery */}
        <ImageGallery images={data.images} name={data.name} />

        {/* Info */}
        <div className="space-y-4">
          {data.categoryName && (
            <Badge variant="secondary">{data.categoryName}</Badge>
          )}
          <h1 className="text-xl font-bold leading-tight">{data.name}</h1>

          <PriceTag
            amount={data.discountPrice ?? data.price}
            originalAmount={hasDiscount ? data.price : undefined}
            className="text-2xl"
          />

          {outOfStock ? (
            <p className="text-sm font-medium text-destructive">
              Mahsulot tugagan
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Mavjud: {data.stockQuantity} ta
            </p>
          )}

          {!outOfStock && (
            <div className="flex items-center gap-4">
              <QuantitySelector
                value={qty}
                max={data.stockQuantity}
                onChange={setQty}
              />
            </div>
          )}

          <Button
            className="w-full gap-2"
            size="lg"
            disabled={outOfStock}
            onClick={handleAdd}
          >
            {outOfStock ? (
              <>Tugagan</>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />
                Savatga qo&apos;shish
              </>
            )}
          </Button>

          {data.description && (
            <div className="space-y-1 border-t pt-4">
              <h2 className="font-semibold">Tavsif</h2>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {data.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
            <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
            <span>Tez yetkazib berish</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-4">
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
