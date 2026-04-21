"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PriceTag } from "@/components/common/PriceTag";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDate, formatPhone } from "@/lib/format";
import type { ApiResponse, OrderDetail, OrderStatus } from "@/types";

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "Confirmed", label: "Tasdiqlash" },
  { value: "Processing", label: "Tayyorlanmoqda" },
  { value: "Shipped", label: "Yo'lga chiqarildi" },
  { value: "Delivered", label: "Yetkazildi" },
  { value: "Cancelled", label: "Bekor qilish" },
];

const statusLabels: Record<OrderStatus, string> = {
  Pending: "Kutilmoqda",
  Confirmed: "Tasdiqlandi",
  Processing: "Tayyorlanmoqda",
  Shipped: "Yo'lda",
  Delivered: "Yetkazildi",
  Cancelled: "Bekor qilindi",
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () =>
      api.get<ApiResponse<OrderDetail>>(`/orders/${id}`).then((r) => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: (status: OrderStatus) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("Holat yangilandi");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const approveProof = useMutation({
    mutationFn: () => api.patch(`/orders/${id}/payment-proof/approve`),
    onSuccess: () => {
      toast.success("Chek tasdiqlandi");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const rejectProof = useMutation({
    mutationFn: () =>
      api.patch(`/orders/${id}/payment-proof/reject`, { adminNote: rejectNote }),
    onSuccess: () => {
      toast.success("Chek rad etildi");
      setShowRejectInput(false);
      setRejectNote("");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  if (isLoading) return <OrderDetailSkeleton />;
  if (error || !data) return <ErrorState message="Buyurtma topilmadi" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">#{data.orderNumber}</h1>
        <span className="text-sm font-medium text-muted-foreground">
          {statusLabels[data.status]}
        </span>
      </div>

      {/* Status actions */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <h2 className="font-semibold text-sm">Holat o&apos;zgartirish</h2>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              disabled={data.status === opt.value || updateStatus.isPending}
              onClick={() => updateStatus.mutate(opt.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
                opt.value === "Cancelled"
                  ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                  : "border-primary/30 text-primary hover:bg-primary/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <h2 className="font-semibold">Mijoz</h2>
        <Row label="Ism" value={data.customerName} />
        <Row label="Telefon" value={formatPhone(data.customerPhone)} />
        <Row label="Manzil" value={data.deliveryAddress} />
        {data.notes && <Row label="Izoh" value={data.notes} />}
        <Row label="To'lov" value={data.paymentMethod} />
        <Row label="Sana" value={formatDate(data.createdAt)} />
      </div>

      {/* Items */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Mahsulotlar</h2>
        {data.items.map((item) => (
          <div key={item.productId} className="flex items-center gap-3">
            {item.productImageUrl && (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={item.productImageUrl}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="line-clamp-1 text-sm font-medium">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} × <PriceTag amount={item.unitPrice} />
              </p>
            </div>
            <PriceTag amount={item.total} className="text-sm font-semibold" />
          </div>
        ))}
        <div className="flex justify-between border-t pt-2 font-bold">
          <span>Jami</span>
          <PriceTag amount={data.totalAmount} />
        </div>
      </div>

      {/* Payment proof */}
      {data.latestProof && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-semibold">To&apos;lov cheki</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm">Holat:</span>
            <span className="text-sm font-medium">{data.latestProof.status}</span>
          </div>

          {data.latestProof.fileType !== "application/pdf" ? (
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              <Image
                src={data.latestProof.fileUrl}
                alt="Chek"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <a
              href={data.latestProof.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline"
            >
              PDF chekni ko&apos;rish
            </a>
          )}

          {data.latestProof.adminNote && (
            <p className="text-sm text-muted-foreground">
              Izoh: {data.latestProof.adminNote}
            </p>
          )}

          {data.latestProof.status === "Pending" && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => approveProof.mutate()}
                  disabled={approveProof.isPending}
                  className="flex-1"
                >
                  Tasdiqlash
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectInput((v) => !v)}
                  className="flex-1"
                >
                  Rad etish
                </Button>
              </div>
              {showRejectInput && (
                <div className="space-y-2">
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Rad etish sababi..."
                    rows={3}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-0 focus:border-ring focus:ring-2 focus:ring-ring/50"
                  />
                  <Button
                    variant="destructive"
                    onClick={() => rejectProof.mutate()}
                    disabled={!rejectNote.trim() || rejectProof.isPending}
                    className="w-full"
                  >
                    Rad etishni tasdiqlash
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
