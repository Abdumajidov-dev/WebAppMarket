"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PriceTag } from "@/components/common/PriceTag";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product, PagedResponse } from "@/types";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-products", page],
    queryFn: () =>
      api
        .get<PagedResponse<Product>>("/products", { params: { page, pageSize: 20 } })
        .then((r) => r.data),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success("Mahsulot o'chirildi");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  function confirmDelete(id: string, name: string) {
    if (window.confirm(`"${name}" mahsulotini o'chirmoqchimisiz?`)) {
      deleteProduct.mutate(id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mahsulotlar</h1>
        <Link
          href="/admin/products/new"
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
        >
          <Plus className="h-4 w-4" />
          Qo&apos;shish
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && <ErrorState message="Mahsulotlar yuklanmadi" onRetry={refetch} />}

      {data && (
        <>
          {data.data.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              Mahsulot yo&apos;q
            </p>
          )}
          <div className="space-y-2">
            {data.data.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-3"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {product.primaryImageUrl ? (
                    <Image
                      src={product.primaryImageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg">
                      📦
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <PriceTag amount={product.discountPrice ?? product.price} />
                    <span>·</span>
                    <span>
                      {product.stockQuantity === 0 ? (
                        <span className="text-destructive">Tugagan</span>
                      ) : (
                        `${product.stockQuantity} ta`
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                    aria-label="Tahrirlash"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => confirmDelete(product.id, product.name)}
                    disabled={deleteProduct.isPending}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "text-destructive hover:text-destructive"
                    )}
                    aria-label="O'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                disabled={!data.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
              >
                Oldingi
              </button>
              <span className="px-3 py-1 text-sm">
                {page} / {data.totalPages}
              </span>
              <button
                disabled={!data.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
              >
                Keyingi
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
