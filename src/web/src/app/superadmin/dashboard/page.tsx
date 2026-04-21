"use client";

import { useEffect, useState } from "react";
import { saApi } from "@/lib/superadminApi";
import type { ApiResponse } from "@/types";

interface Stats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  activeSubs: number;
  suspended: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saApi
      .get<ApiResponse<Stats>>("/superadmin/stats")
      .then((r) => setStats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Jami do'konlar", value: stats?.totalTenants ?? 0, color: "bg-blue-50 text-blue-700" },
    { label: "Faol do'konlar", value: stats?.activeTenants ?? 0, color: "bg-green-50 text-green-700" },
    { label: "Trial", value: stats?.trialTenants ?? 0, color: "bg-yellow-50 text-yellow-700" },
    { label: "To'xtatilgan", value: stats?.suspended ?? 0, color: "bg-red-50 text-red-700" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl p-5 ${c.color}`}>
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-sm mt-1 font-medium opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <a
          href="/superadmin/tenants"
          className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Barcha do&apos;konlar →
        </a>
        <a
          href="/superadmin/tenants/new"
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + Yangi do&apos;kon
        </a>
      </div>
    </div>
  );
}
