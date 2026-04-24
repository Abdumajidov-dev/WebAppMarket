"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { saApi } from "@/lib/superadminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Faqat kichik harf, raqam va -"),
  shopName: z.string().min(2),
  ownerName: z.string().min(2),
  phone: z.string().min(9),
  password: z.string().min(6),
  telegramUsername: z.string().optional(),
  primaryColor: z.string().optional(),
  trialDays: z.string(),
});

type FormData = z.infer<typeof schema>;

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { trialDays: "30" } });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await saApi.post("/superadmin/tenants", { ...data, trialDays: Number(data.trialDays) });
      toast.success("Do'kon yaratildi");
      router.push("/superadmin/tenants");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Orqaga
        </button>
        <h1 className="text-2xl font-bold">Yangi do&apos;kon</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-background rounded-xl border p-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Slug" error={errors.slug?.message}>
            <Input placeholder="my-shop" {...register("slug")} />
          </Field>
          <Field label="Sinov kunlari" error={errors.trialDays?.message}>
            <Input type="number" {...register("trialDays")} />
          </Field>
        </div>

        <Field label="Do'kon nomi" error={errors.shopName?.message}>
          <Input placeholder="Mening Do'konim" {...register("shopName")} />
        </Field>

        <Field label="Egasi ismi" error={errors.ownerName?.message}>
          <Input placeholder="Alisher Karimov" {...register("ownerName")} />
        </Field>

        <Field label="Telefon" error={errors.phone?.message}>
          <Input type="tel" placeholder="+998901234567" {...register("phone")} />
        </Field>

        <Field label="Parol" error={errors.password?.message}>
          <Input type="password" placeholder="Kamida 6 ta belgi" {...register("password")} />
        </Field>

        <Field label="Telegram username (ixtiyoriy)" error={errors.telegramUsername?.message}>
          <Input placeholder="@username yoki username" {...register("telegramUsername")} />
        </Field>

        <Field label="Asosiy rang (ixtiyoriy)" error={errors.primaryColor?.message}>
          <div className="flex gap-2">
            <Input placeholder="#2563EB" {...register("primaryColor")} />
            <input type="color" defaultValue="#2563EB" className="h-10 w-10 rounded border cursor-pointer" />
          </div>
        </Field>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Yaratilmoqda..." : "Do'kon yaratish"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
