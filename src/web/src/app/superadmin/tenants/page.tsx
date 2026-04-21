"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saApi } from "@/lib/superadminApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Tenant {
  id: string;
  slug: string;
  shopName: string;
  ownerName: string;
  phone: string;
  isActive: boolean;
  subscriptionStatus: number;
  subscriptionEndsAt?: string;
  createdAt: string;
}

interface TenantsResponse {
  data: Tenant[];
  totalCount: number;
  page: number;
  totalPages: number;
}

const SUB_LABELS: Record<number, string> = { 0: "Trial", 1: "Faol", 2: "To'xtatilgan" };
const SUB_COLORS: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-800",
  1: "bg-green-100 text-green-800",
  2: "bg-red-100 text-red-800",
};

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await saApi.get<TenantsResponse>("/superadmin/tenants", {
        params: { page: p, pageSize: 20, search: q || undefined },
      });
      setTenants(res.data.data);
      setTotal(res.data.totalCount);
      setTotalPages(res.data.totalPages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, search);
  }, [load, page, search]);

  async function toggle(id: string) {
    await saApi.patch(`/superadmin/tenants/${id}/toggle`);
    toast.success("Yangilandi");
    load(page, search);
  }

  async function deleteTenant(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await saApi.delete(`/superadmin/tenants/${id}`);
    toast.success("O'chirildi");
    load(page, search);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Do&apos;konlar</h1>
          <p className="text-sm text-muted-foreground">Jami: {total}</p>
        </div>
        <Button onClick={() => router.push("/superadmin/tenants/new")}>
          + Yangi do&apos;kon
        </Button>
      </div>

      <Input
        placeholder="Qidirish: nom, telefon, slug..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-sm"
      />

      <div className="rounded-lg border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Do&apos;kon</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Telefon</th>
              <th className="px-4 py-3 text-left font-medium">Obuna</th>
              <th className="px-4 py-3 text-left font-medium">Holat</th>
              <th className="px-4 py-3 text-left font-medium">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Do&apos;konlar topilmadi
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <p>{t.shopName}</p>
                    <p className="text-xs text-muted-foreground">{t.ownerName}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.slug}</td>
                  <td className="px-4 py-3">{t.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SUB_COLORS[t.subscriptionStatus]}`}>
                      {SUB_LABELS[t.subscriptionStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {t.isActive ? "Faol" : "Nofaol"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/superadmin/tenants/${t.id}`)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Tahrir
                      </button>
                      <button
                        onClick={() => toggle(t.id)}
                        className="text-xs text-yellow-600 hover:underline"
                      >
                        {t.isActive ? "To'xtat" : "Faollashtir"}
                      </button>
                      <button
                        onClick={() => deleteTenant(t.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        O&apos;chir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Oldingi
          </Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Keyingi →
          </Button>
        </div>
      )}
    </div>
  );
}
