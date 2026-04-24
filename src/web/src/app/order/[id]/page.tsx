"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, Package, Truck, XCircle, Home } from "lucide-react";
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
  Pending:    { label: "Kutilmoqda",     icon: <Clock className="h-5 w-5" />,       color: "text-yellow-600 bg-yellow-50" },
  Confirmed:  { label: "Tasdiqlandi",    icon: <CheckCircle className="h-5 w-5" />, color: "text-blue-600 bg-blue-50" },
  Processing: { label: "Tayyorlanmoqda", icon: <Package className="h-5 w-5" />,     color: "text-purple-600 bg-purple-50" },
  Shipped:    { label: "Yo'lda",         icon: <Truck className="h-5 w-5" />,       color: "text-indigo-600 bg-indigo-50" },
  Delivered:  { label: "Yetkazildi",     icon: <CheckCircle className="h-5 w-5" />, color: "text-green-600 bg-green-50" },
  Cancelled:  { label: "Bekor qilindi",  icon: <XCircle className="h-5 w-5" />,     color: "text-red-600 bg-red-50" },
};

const statusOrder: OrderStatus[] = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

function OrderContent() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["order-track", id],
    queryFn: () =>
      api
        .get<ApiResponse<OrderDetail>>(`/orders/track/${id}`)
        .then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  if (isLoading) return <OrderPageSkeleton />;
  if (error || !data)
    return <ErrorState message="Buyurtma topilmadi" onRetry={refetch} />;

  const cfg = statusConfig[data.status];
  const currentIdx = statusOrder.indexOf(data.status);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Success header */}
      <div className="bg-[#7B2FF7] px-4 pb-6 pt-4 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Buyurtma #{data.orderNumber}</h1>
          <Link href="/" className="rounded-full bg-white/20 p-2">
            <Home className="h-4 w-4" />
          </Link>
        </div>
        <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 ${cfg.color}`}>
          {cfg.icon}
          <span className="font-semibold">{cfg.label}</span>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Progress bar */}
        {data.status !== "Cancelled" && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-medium text-gray-500">Buyurtma holati</p>
            <div className="flex items-center gap-1">
              {statusOrder.map((s, idx) => (
                <div key={s} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`h-2 w-full rounded-full ${
                      idx <= currentIdx ? "bg-[#7B2FF7]" : "bg-gray-200"
                    }`}
                  />
                  <span className="text-[9px] text-gray-400 text-center leading-tight">
                    {statusConfig[s].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer info */}
        <div className="rounded-2xl bg-white p-4 shadow-sm space-y-2">
          <h2 className="font-semibold text-gray-800">Ma&apos;lumotlar</h2>
          <Row label="Ism" value={data.customerName} />
          <Row label="Telefon" value={formatPhone(data.customerPhone)} />
          <Row label="Manzil" value={data.deliveryAddress} />
          {data.notes && <Row label="Izoh" value={data.notes} />}
          <Row label="Sana" value={formatDate(data.createdAt)} />
        </div>

        {/* Items */}
        <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-800">Mahsulotlar</h2>
          {data.items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-gray-500 line-clamp-1 flex-1 pr-2">
                {item.productName} × {item.quantity}
              </span>
              <PriceTag amount={item.total} />
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Jami</span>
            <PriceTag amount={data.totalAmount} className="text-[#7B2FF7]" />
          </div>
        </div>

        {/* Payment proof */}
        {data.latestProof && (
          <div className="rounded-2xl bg-white p-4 shadow-sm space-y-1">
            <h2 className="font-semibold text-gray-800">To&apos;lov cheki</h2>
            <ProofStatus status={data.latestProof.status} note={data.latestProof.adminNote} />
          </div>
        )}

        {/* Bottom CTA */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#7B2FF7] py-3 text-sm font-semibold text-white"
        >
          <Home className="h-4 w-4" />
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-right max-w-[60%] text-gray-800">{value}</span>
    </div>
  );
}

function ProofStatus({ status, note }: { status: string; note?: string }) {
  const map: Record<string, { label: string; color: string }> = {
    Pending:  { label: "Kutilmoqda", color: "text-yellow-600" },
    Approved: { label: "Tasdiqlandi", color: "text-green-600" },
    Rejected: { label: "Rad etildi", color: "text-red-600" },
  };
  const cfg = map[status] ?? { label: status, color: "" };
  return (
    <div>
      <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
      {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
    </div>
  );
}

function OrderPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#7B2FF7] h-24" />
      <div className="px-4 pt-4 space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<OrderPageSkeleton />}>
      <OrderContent />
    </Suspense>
  );
}
