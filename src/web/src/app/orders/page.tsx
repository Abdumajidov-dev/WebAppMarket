"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Package, ChevronRight, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse } from "@/types";

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  itemCount: number;
}

const STATUS: Record<string, { label: string; color: string }> = {
  Pending:    { label: "Kutilmoqda",  color: "bg-yellow-100 text-yellow-700" },
  Confirmed:  { label: "Tasdiqlandi", color: "bg-blue-100 text-blue-700" },
  Processing: { label: "Jarayonda",   color: "bg-purple-100 text-purple-700" },
  Shipped:    { label: "Yo'lda",      color: "bg-indigo-100 text-indigo-700" },
  Delivered:  { label: "Yetkazildi",  color: "bg-green-100 text-green-700" },
  Cancelled:  { label: "Bekor",       color: "bg-red-100 text-red-700" },
};

function fmt(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function OrdersPage() {
  const [phone, setPhone] = useState("");
  const [inputPhone, setInputPhone] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("customer_phone");
    if (saved) {
      setPhone(saved);
    } else {
      setEditing(true);
    }
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["customer-orders", phone],
    queryFn: () =>
      api
        .get<ApiResponse<{ items: CustomerOrder[]; total: number }>>("/orders/customer", {
          params: { phone, pageSize: 50 },
        })
        .then((r) => r.data.data),
    enabled: !!phone,
  });

  const orders = data?.items ?? [];

  function savePhone() {
    const cleaned = inputPhone.replace(/\s/g, "");
    if (!cleaned) return;
    localStorage.setItem("customer_phone", cleaned);
    setPhone(cleaned);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-[#7B2FF7] px-4 pb-6 pt-4">
          <h1 className="text-lg font-bold text-white">Buyurtmalarim</h1>
          <p className="mt-0.5 text-xs text-white/70">Telefon raqamingizni bir marta kiriting</p>
        </div>
        <div className="px-4 pt-8 flex flex-col gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-[#7B2FF7]">
              <Phone className="h-5 w-5" />
              <p className="font-semibold text-gray-800">Telefon raqam</p>
            </div>
            <input
              type="tel"
              value={inputPhone}
              onChange={(e) => setInputPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && savePhone()}
              placeholder="+998901234567"
              inputMode="tel"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#7B2FF7] focus:ring-2 focus:ring-[#7B2FF7]/20"
            />
            <button
              onClick={savePhone}
              className="w-full rounded-xl bg-[#7B2FF7] py-3 text-sm font-semibold text-white"
            >
              Buyurtmalarni ko&apos;rish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#7B2FF7] px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Buyurtmalarim</h1>
            <p className="mt-0.5 text-xs text-white/70">{phone}</p>
          </div>
          <button
            onClick={() => { setInputPhone(phone); setEditing(true); }}
            className="rounded-full bg-white/20 px-3 py-1 text-xs text-white"
          >
            O&apos;zgartirish
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Package className="h-14 w-14 text-gray-200" />
            <p className="mt-4 font-semibold text-gray-700">Buyurtma topilmadi</p>
            <p className="mt-1 text-sm text-gray-400">
              Hali buyurtma bermagansiz
            </p>
            <Link
              href="/"
              className="mt-5 rounded-xl bg-[#7B2FF7] px-6 py-2.5 text-sm font-semibold text-white"
            >
              Xarid qilish
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">{orders.length} ta buyurtma</p>
            {orders.map((o) => {
              const st = STATUS[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-600" };
              return (
                <Link
                  key={o.id}
                  href={`/order/${o.orderNumber}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm active:opacity-80"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3EEFF] text-2xl">
                    📦
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-800">#{o.orderNumber}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{fmtDate(o.createdAt)} · {o.itemCount} ta mahsulot</p>
                    <p className="mt-0.5 text-sm font-bold text-[#7B2FF7]">{fmt(o.totalAmount)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
