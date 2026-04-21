"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { PriceTag } from "@/components/common/PriceTag";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { formatDate } from "@/lib/format";
import type { Order, OrderStatus, PagedResponse } from "@/types";

const statusLabels: Record<OrderStatus, string> = {
  Pending: "Kutilmoqda",
  Confirmed: "Tasdiqlandi",
  Processing: "Tayyorlanmoqda",
  Shipped: "Yo'lda",
  Delivered: "Yetkazildi",
  Cancelled: "Bekor",
};

const statusColors: Record<OrderStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Processing: "bg-purple-100 text-purple-700",
  Shipped: "bg-indigo-100 text-indigo-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const filters: { value: string; label: string }[] = [
  { value: "", label: "Barchasi" },
  { value: "Pending", label: "Kutilmoqda" },
  { value: "Confirmed", label: "Tasdiqlandi" },
  { value: "Processing", label: "Tayyorlanmoqda" },
  { value: "Shipped", label: "Yo'lda" },
  { value: "Delivered", label: "Yetkazildi" },
  { value: "Cancelled", label: "Bekor" },
];

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-orders", statusFilter, page],
    queryFn: () =>
      api
        .get<PagedResponse<Order>>("/orders", {
          params: { status: statusFilter || undefined, page, pageSize: 20 },
        })
        .then((r) => r.data),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Buyurtmalar</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && <ErrorState message="Buyurtmalar yuklanmadi" onRetry={refetch} />}

      {data && (
        <>
          <div className="space-y-2">
            {data.data.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">Buyurtma yo'q</p>
            )}
            {data.data.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColors[order.status]
                      }`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.customerName}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <PriceTag amount={order.totalAmount} />
                    <span>·</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>

          {/* Pagination */}
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
