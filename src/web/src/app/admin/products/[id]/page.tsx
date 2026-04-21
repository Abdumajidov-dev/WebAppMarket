"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductForm } from "@/components/admin/ProductForm";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse, ProductDetail } from "@/types";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () =>
      api.get<ApiResponse<ProductDetail>>(`/products/id/${id}`).then((r) => r.data.data),
  });

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );

  if (error || !data)
    return <ErrorState message="Mahsulot topilmadi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Mahsulotni tahrirlash</h1>
      <ProductForm product={data} />
    </div>
  );
}
