"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse } from "@/types";

interface PaymentSettings {
  cardNumber: string;
  cardHolder: string;
  bankName?: string;
  instructions?: string;
}

interface ShopInfo {
  name: string;
  logoUrl?: string;
}

const paymentSchema = z.object({
  cardNumber: z.string().min(16, "16 ta raqam kiriting").max(19),
  cardHolder: z.string().min(2, "Karta egasi ismini kiriting"),
  bankName: z.string().optional(),
  instructions: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function SettingsPage() {
  const qc = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const { data: shopInfo, isLoading: shopLoading } = useQuery({
    queryKey: ["shop-info"],
    queryFn: () =>
      api.get<ApiResponse<ShopInfo>>("/shop/info").then((r) => r.data.data),
  });

  const { data: paymentData, isLoading: paymentLoading } = useQuery({
    queryKey: ["payment-settings-admin"],
    queryFn: () =>
      api.get<ApiResponse<PaymentSettings>>("/shop/payment-settings").then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    values: paymentData
      ? {
          cardNumber: paymentData.cardNumber ?? "",
          cardHolder: paymentData.cardHolder ?? "",
          bankName: paymentData.bankName ?? "",
          instructions: paymentData.instructions ?? "",
        }
      : undefined,
  });

  const savePayment = useMutation({
    mutationFn: (data: PaymentFormData) =>
      api.put("/shop/payment-settings", {
        ...data,
        bankName: data.bankName || null,
        instructions: data.instructions || null,
      }),
    onSuccess: () => {
      toast.success("Sozlamalar saqlandi");
      qc.invalidateQueries({ queryKey: ["payment-settings-admin"] });
    },
    onError: () => toast.error("Saqlashda xatolik"),
  });

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm fayllar");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("2MB dan oshmasligi kerak");
      return;
    }
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append("logo", file);
      await api.post("/shop/logo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Logo yuklandi");
      qc.invalidateQueries({ queryKey: ["shop-info"] });
    } catch {
      toast.error("Yuklashda xatolik");
    } finally {
      setLogoUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Sozlamalar</h1>

      {/* Shop logo */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Do&apos;kon logosi</h2>
        {shopLoading ? (
          <Skeleton className="h-20 w-20 rounded-xl" />
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-xl border bg-muted">
              {shopInfo?.logoUrl ? (
                <Image
                  src={shopInfo.logoUrl}
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl">
                  🏪
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => logoRef.current?.click()}
                disabled={logoUploading}
              >
                {logoUploading ? "Yuklanmoqda..." : "Logo o'zgartirish"}
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG — max 2MB</p>
            </div>
          </div>
        )}
        <input
          ref={logoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleLogoUpload(f);
          }}
        />
      </div>

      {/* Payment settings */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Karta to&apos;lov sozlamalari</h2>
        {paymentLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit((d) => savePayment.mutate(d))} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cardNumber">Karta raqami</Label>
              <Input
                id="cardNumber"
                placeholder="8600 0000 0000 0000"
                inputMode="numeric"
                {...register("cardNumber")}
                aria-invalid={!!errors.cardNumber}
              />
              {errors.cardNumber && (
                <p className="text-xs text-destructive">{errors.cardNumber.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="cardHolder">Karta egasi</Label>
              <Input
                id="cardHolder"
                placeholder="SARDOR ABDULLAYEV"
                {...register("cardHolder")}
                aria-invalid={!!errors.cardHolder}
              />
              {errors.cardHolder && (
                <p className="text-xs text-destructive">{errors.cardHolder.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="bankName">Bank nomi (ixtiyoriy)</Label>
              <Input id="bankName" placeholder="Uzcard, Humo..." {...register("bankName")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="instructions">Yo&apos;riqnoma (ixtiyoriy)</Label>
              <textarea
                id="instructions"
                rows={3}
                placeholder="To'lov qilgach chekni yuboring..."
                {...register("instructions")}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 resize-none"
              />
            </div>

            <Button type="submit" disabled={savePayment.isPending}>
              {savePayment.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
