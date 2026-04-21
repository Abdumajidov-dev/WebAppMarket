"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { saApi } from "@/lib/superadminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Tenant {
  id: string;
  slug: string;
  shopName: string;
  ownerName: string;
  phone: string;
  isActive: boolean;
  subscriptionStatus: number;
  subscriptionEndsAt?: string;
}

const subSchema = z.object({
  status: z.string(),
  endsAt: z.string().optional(),
});

type SubForm = z.infer<typeof subSchema>;

const SUB_OPTIONS = [
  { value: 0, label: "Trial" },
  { value: 1, label: "Faol (Active)" },
  { value: 2, label: "To'xtatilgan (Suspended)" },
];

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubForm>({
    resolver: zodResolver(subSchema),
  });

  useEffect(() => {
    saApi
      .get<{ data: Tenant[] }>("/superadmin/tenants", { params: { pageSize: 1000 } })
      .then((r) => {
        const found = r.data.data.find((t) => t.id === params.id);
        if (found) {
          setTenant(found);
          reset({
            status: String(found.subscriptionStatus),
            endsAt: found.subscriptionEndsAt
              ? new Date(found.subscriptionEndsAt).toISOString().split("T")[0]
              : undefined,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [params.id, reset]);

  async function toggle() {
    if (!tenant) return;
    setToggling(true);
    try {
      await saApi.patch(`/superadmin/tenants/${tenant.id}/toggle`);
      setTenant({ ...tenant, isActive: !tenant.isActive });
      toast.success("Holat yangilandi");
    } finally {
      setToggling(false);
    }
  }

  async function onSubSubmit(data: SubForm) {
    if (!tenant) return;
    setSaving(true);
    try {
      await saApi.patch(`/superadmin/tenants/${tenant.id}/subscription`, {
        status: Number(data.status),
        endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : null,
      });
      toast.success("Obuna yangilandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted animate-pulse rounded" /></div>;
  }

  if (!tenant) {
    return <p className="text-muted-foreground">Do&apos;kon topilmadi</p>;
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
        <h1 className="text-2xl font-bold">{tenant.shopName}</h1>
      </div>

      <div className="bg-background rounded-xl border p-6 space-y-3">
        <h2 className="font-semibold">Ma&apos;lumotlar</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Slug</dt><dd>{tenant.slug}</dd>
          <dt className="text-muted-foreground">Egasi</dt><dd>{tenant.ownerName}</dd>
          <dt className="text-muted-foreground">Telefon</dt><dd>{tenant.phone}</dd>
          <dt className="text-muted-foreground">Holat</dt>
          <dd>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tenant.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
              {tenant.isActive ? "Faol" : "Nofaol"}
            </span>
          </dd>
        </dl>
        <Button
          variant={tenant.isActive ? "destructive" : "default"}
          size="sm"
          onClick={toggle}
          disabled={toggling}
        >
          {toggling ? "..." : tenant.isActive ? "Do'konni to'xtatish" : "Do'konni faollashtirish"}
        </Button>
      </div>

      <form
        onSubmit={handleSubmit(onSubSubmit)}
        className="bg-background rounded-xl border p-6 space-y-4"
      >
        <h2 className="font-semibold">Obuna boshqaruvi</h2>

        <div className="space-y-1">
          <Label>Obuna holati</Label>
          <select
            {...register("status")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SUB_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
        </div>

        <div className="space-y-1">
          <Label>Tugash sanasi (ixtiyoriy)</Label>
          <Input type="date" {...register("endsAt")} />
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </form>
    </div>
  );
}
