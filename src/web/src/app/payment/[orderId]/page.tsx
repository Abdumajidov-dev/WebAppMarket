"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Upload, FileImage } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/ErrorState";
import { PriceTag } from "@/components/common/PriceTag";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse, OrderDetail } from "@/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024;

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () =>
      api
        .get<ApiResponse<OrderDetail>>(`/orders/${orderId}`)
        .then((r) => r.data.data),
  });

  function handleFile(f: File) {
    if (!ACCEPTED.includes(f.type)) {
      toast.error("Faqat JPG, PNG, WebP yoki PDF");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("Fayl hajmi 5MB dan oshmasligi kerak");
      return;
    }
    setFile(f);
    if (f.type !== "application/pdf") {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post(`/orders/${orderId}/payment-proof`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Chek yuborildi! Tasdiqlash kutilmoqda.");
      router.push(`/order/${orderId}`);
    } catch {
      toast.error("Yuklashda xatolik. Qayta urinib ko'ring.");
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) return <PaymentSkeleton />;
  if (error || !data)
    return <ErrorState message="Buyurtma topilmadi" onRetry={refetch} />;

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold">Karta to&apos;lov</h1>

      {/* Card details */}
      {data.paymentMethod === "CardTransfer" && (
        <CardInfo orderId={orderId} totalAmount={data.totalAmount} />
      )}

      {/* Upload area */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Chekni yuklash</h2>
        <p className="text-sm text-muted-foreground">
          To&apos;lov skrinshoti yoki bankdan chekni yuklang
        </p>

        <div
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-primary/5"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="max-h-48 rounded-lg object-contain" />
          ) : file ? (
            <div className="flex items-center gap-2 text-sm">
              <FileImage className="h-8 w-8 text-muted-foreground" />
              <span>{file.name}</span>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Bosing yoki faylni shu yerga tashlang
              </p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP, PDF — max 5MB</p>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {file && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? "Yuklanmoqda..." : "Chekni yuborish"}
          </Button>
        )}
      </div>
    </div>
  );
}

function CardInfo({
  orderId,
  totalAmount,
}: {
  orderId: string;
  totalAmount: number;
}) {
  const { data } = useQuery({
    queryKey: ["payment-settings", orderId],
    queryFn: () =>
      api
        .get<ApiResponse<{ cardNumber: string; cardHolder: string; bankName?: string }>>(
          `/shop/payment-settings`
        )
        .then((r) => r.data.data),
  });

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <h2 className="font-semibold">Karta ma&apos;lumotlari</h2>
      {data ? (
        <>
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Karta raqami</p>
            <p className="font-mono text-lg font-bold tracking-widest">
              {data.cardNumber}
            </p>
            <p className="text-sm">{data.cardHolder}</p>
            {data.bankName && (
              <p className="text-xs text-muted-foreground">{data.bankName}</p>
            )}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">To&apos;lanadigan summa:</span>
            <PriceTag amount={totalAmount} className="font-bold" />
          </div>
        </>
      ) : (
        <Skeleton className="h-20 w-full" />
      )}
    </div>
  );
}

function PaymentSkeleton() {
  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
