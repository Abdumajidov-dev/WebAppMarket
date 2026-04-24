"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import { PriceTag } from "@/components/common/PriceTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiResponse, PaymentMethod } from "@/types";

const schema = z.object({
  customerName: z.string().min(2, "Ism kamida 2 harf"),
  customerPhone: z
    .string()
    .regex(/^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/, "Telefon: +998 XX XXX XX XX"),
  deliveryAddress: z.string().min(5, "Manzil kamida 5 harf"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["Cash", "CardTransfer"] as const),
});

type FormData = z.infer<typeof schema>;

const paymentOptions: { value: PaymentMethod; label: string; desc: string }[] = [
  { value: "Cash", label: "Naqd pul", desc: "Yetkazib berishda to'lang" },
  { value: "CardTransfer", label: "Karta o'tkazma", desc: "Kartaga o'tkazib chek yuboring" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clear } = useCartStore();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "Cash" },
  });

  const paymentMethod = watch("paymentMethod");

  function formatPhoneInput(value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits.startsWith("998")) {
      const trimmed = digits.startsWith("8") ? digits.slice(1) : digits;
      const withCode = "998" + trimmed;
      return formatPhoneDisplay(withCode);
    }
    return formatPhoneDisplay(digits);
  }

  function formatPhoneDisplay(digits: string) {
    const d = digits.slice(0, 12);
    let result = "+998";
    if (d.length > 3) result += " " + d.slice(3, 5);
    if (d.length > 5) result += " " + d.slice(5, 8);
    if (d.length > 8) result += " " + d.slice(8, 10);
    if (d.length > 10) result += " " + d.slice(10, 12);
    return result;
  }

  async function onSubmit(data: FormData) {
    if (items.length === 0) {
      toast.error("Savat bo'sh");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<{ id: string; orderNumber: string }>>(
        "/orders",
        {
          customerName: data.customerName,
          customerPhone: data.customerPhone.replace(/\s/g, ""),
          deliveryAddress: data.deliveryAddress,
          notes: data.notes || null,
          paymentMethod: data.paymentMethod,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }
      );
      clear();
      localStorage.setItem("customer_phone", data.customerPhone.replace(/\s/g, ""));
      const order = res.data.data;
      if (data.paymentMethod === "CardTransfer") {
        router.push(`/payment/${order.orderNumber}?id=${order.id}`);
      } else {
        router.push(`/order/${order.orderNumber}`);
      }
    } catch {
      toast.error("Buyurtma berishda xatolik. Qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Savat bo&apos;sh</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="mb-4 text-xl font-bold">Buyurtma</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Contact */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Ma&apos;lumotlar</h2>

          <div className="space-y-1">
            <Label htmlFor="customerName">Ism familiya</Label>
            <Input
              id="customerName"
              placeholder="Abdullayev Sardor"
              {...register("customerName")}
              aria-invalid={!!errors.customerName}
            />
            {errors.customerName && (
              <p className="text-xs text-destructive">{errors.customerName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="customerPhone">Telefon raqam</Label>
            <Input
              id="customerPhone"
              placeholder="+998 90 123 45 67"
              inputMode="tel"
              {...register("customerPhone")}
              onChange={(e) => {
                setValue("customerPhone", formatPhoneInput(e.target.value), {
                  shouldValidate: true,
                });
              }}
              aria-invalid={!!errors.customerPhone}
            />
            {errors.customerPhone && (
              <p className="text-xs text-destructive">{errors.customerPhone.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="deliveryAddress">Yetkazib berish manzili</Label>
            <Input
              id="deliveryAddress"
              placeholder="Toshkent, Yunusobod, 1-uy"
              {...register("deliveryAddress")}
              aria-invalid={!!errors.deliveryAddress}
            />
            {errors.deliveryAddress && (
              <p className="text-xs text-destructive">{errors.deliveryAddress.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Izoh (ixtiyoriy)</Label>
            <Input
              id="notes"
              placeholder="Qo'shimcha ma'lumot..."
              {...register("notes")}
            />
          </div>
        </div>

        {/* Payment method */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-semibold">To&apos;lov usuli</h2>
          <div className="flex flex-col gap-2">
            {paymentOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  paymentMethod === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <input
                  type="radio"
                  value={opt.value}
                  {...register("paymentMethod")}
                  className="accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h2 className="font-semibold">Buyurtma</h2>
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground line-clamp-1 flex-1 pr-2">
                {product.name} × {quantity}
              </span>
              <PriceTag amount={(product.discountPrice ?? product.price) * quantity} />
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Jami</span>
            <PriceTag amount={total()} className="text-base" />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? "Yuborilmoqda..." : "Buyurtmani tasdiqlash"}
        </Button>
      </form>
    </div>
  );
}
