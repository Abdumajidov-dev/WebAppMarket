"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ErrorState } from "@/components/common/ErrorState";
import type { PagedResponse, Product } from "@/types";

export default function HomePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: () =>
      api
        .get<PagedResponse<Product>>("/products", { params: { pageSize: 20 } })
        .then((r) => r.data),
  });

  if (error) return <ErrorState message="Mahsulotlar yuklanmadi" onRetry={refetch} />;

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="mb-4 text-xl font-bold">Mahsulotlar</h1>
      <ProductGrid products={data?.data ?? []} isLoading={isLoading} />
    </div>
  );
}
