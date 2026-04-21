"use client";

import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { PriceTag } from "@/components/common/PriceTag";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse } from "@/types";

interface ShopStats {
  todayOrders: number;
  todayRevenue: number;
  weekOrders: number;
  weekRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["shop-stats"],
    queryFn: () =>
      api.get<ApiResponse<ShopStats>>("/shop/stats").then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>

      {/* Today */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Bugun
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
            label="Buyurtmalar"
            value={String(data?.todayOrders ?? 0)}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            label="Daromad"
            value={<PriceTag amount={data?.todayRevenue ?? 0} />}
            bg="bg-green-50"
          />
        </div>
      </section>

      {/* Week */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Bu hafta
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<ShoppingBag className="h-5 w-5 text-purple-600" />}
            label="Buyurtmalar"
            value={String(data?.weekOrders ?? 0)}
            bg="bg-purple-50"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-orange-600" />}
            label="Daromad"
            value={<PriceTag amount={data?.weekRevenue ?? 0} />}
            bg="bg-orange-50"
          />
        </div>
      </section>

      {/* Month */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Bu oy
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<ShoppingBag className="h-5 w-5 text-indigo-600" />}
            label="Buyurtmalar"
            value={String(data?.monthOrders ?? 0)}
            bg="bg-indigo-50"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-teal-600" />}
            label="Daromad"
            value={<PriceTag amount={data?.monthRevenue ?? 0} />}
            bg="bg-teal-50"
          />
        </div>
      </section>

      {/* Products */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Mahsulotlar
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Package className="h-5 w-5 text-slate-600" />}
            label="Jami"
            value={String(data?.totalProducts ?? 0)}
            bg="bg-slate-50"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
            label="Kam qolgan (≤5)"
            value={String(data?.lowStockProducts ?? 0)}
            bg="bg-red-50"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  bg: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className={`inline-flex rounded-lg p-2 ${bg}`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-32" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
