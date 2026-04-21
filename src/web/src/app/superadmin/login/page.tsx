"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { saApi, setSaAuthToken } from "@/lib/superadminApi";
import { useSuperAdminStore } from "@/store/superadmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiResponse } from "@/types";

const schema = z.object({
  phone: z.string().min(1, "Telefon raqam kiriting"),
  password: z.string().min(1, "Parol kiriting"),
});

type FormData = z.infer<typeof schema>;

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const setUser = useSuperAdminStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await saApi.post<
        ApiResponse<{
          accessToken: string;
          user: { id: string; phone: string; role: string; tenantId: string };
        }>
      >("/auth/login", data);
      const { accessToken, user } = res.data.data;
      setSaAuthToken(accessToken);
      setUser(user);
      router.push("/superadmin/dashboard");
    } catch {
      toast.error("Telefon yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">UzMarket SuperAdmin</h1>
          <p className="text-sm text-muted-foreground">Platform boshqaruv paneli</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="phone">Telefon raqam</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+998882641919"
              {...register("phone")}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Parol</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Kirish..." : "Kirish"}
          </Button>
        </form>
      </div>
    </div>
  );
}
