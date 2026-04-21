"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { PriceTag } from "@/components/common/PriceTag";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPhone } from "@/lib/format";
import type { ApiResponse, OrderDetail, OrderStatus } from "@/types";

const statusConfig: Record<
  OrderStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  Pending: {
    label: "Kutilmoqda",
    icon: <Clock className="h-5 w-5" />,
    color: "text-yellow-600 bg-yellow-50",
  },
  Confirmed: {
    label: "Tasdiqlandi",
    icon: <CheckCircle className="h-5 w-5" />,
    color: "text-blue-600 bg-blue-50",
  },
  Processing: {
    label: "Tayyorlanmoqda",
    icon: <Package className="h-5 w-5" />,
    color: "text-purple-600 bg-purple-50",
  },
  Shipped: {
    label: "Yo'lda",
    icon: <Truck className="h-5 w-5" />,
    color: "text-indigo-600 bg-indigo-50",
  },
  Delivered: {
    label: "Yetkazildi",
    icon: <CheckCircle className="h-5 w-5" />,
    color: "text-green-600 bg-green-50",
  },
  Cancelled: {
    label: "Bekor qilindi",
    icon: <XCircle className="h-5 w-5" />,
    color: "text-red-600 bg-red-50",
  },
};

const statusOrder: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
];

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: () =>
      api
        .get<ApiResponse<OrderDetail>>(`/orders/${id}`)
        .then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  if (isLoading) return <OrderPageSkeleton />;
  if (error || !data)
    return <ErrorState message="Buyurtma topilmadi" onRetry={refetch} />;

  const cfg = statusConfig[data.status];
  const currentIdx = statusOrder.indexOf(data.status);

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Buyurtma</h1>
        <span className="text-sm text-muted-foreground">#{data.orderNumber}</span>
      </div>

      {/* Status badge */}
      <div className={`flex items-center gap-2 rounded-xl p-4 ${cfg.color}`}>
        {cfg.icon}
        <span className="font-semibold">{cfg.label}</span>
      </div>

      {/* Progress timeline (not shown for Cancelled) */}
      {data.status !== "Cancelled" && (
        <div className="flex items-center gap-1">
          {statusOrder.map((s, idx) => (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div
                className={`h-2 flex-1 rounded-full ${
                  idx <= currentIdx ? "bg-primary" : "bg-muted"
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Customer info */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <h2 className="font-semibold">Ma&apos;lumotlar</h2>
        <Row label="Ism" value={data.customerName} />
        <Row label="Telefon" value={formatPhone(data.customerPhone)} />
        <Row label="Manzil" value={data.deliveryAddress} />
        {data.notes && <Row label="Izoh" value={data.notes} />}
        <Row label="Sana" value={formatDate(data.createdAt)} />
      </div>

      {/* Items */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Mahsulotlar</h2>
        {data.items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span className="text-muted-foreground line-clamp-1 flex-1 pr-2">
              {item.productName} × {item.quantity}
            </span>
            <PriceTag amount={item.total} />
          </div>
        ))}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Jami</span>
          <PriceTag amount={data.totalAmount} />
        </div>
      </div>

      {/* Payment proof status */}
      {data.latestProof && (
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <h2 className="font-semibold">To&apos;lov cheki</h2>
          <ProofStatus status={data.latestProof.status} note={data.latestProof.adminNote} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function ProofStatus({ status, note }: { status: string; note?: string }) {
  const map: Record<string, { label: string; color: string }> = {
    Pending: { label: "Kutilmoqda", color: "text-yellow-600" },
    Approved: { label: "Tasdiqlandi", color: "text-green-600" },
    Rejected: { label: "Rad etildi", color: "text-red-600" },
  };
  const cfg = map[status] ?? { label: status, color: "" };
  return (
    <div>
      <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
      {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
    </div>
  );
}

function OrderPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-4 w-full rounded-full" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
