"use client";

import Link from "next/link";
import { Bell, ShoppingBag, Receipt } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { formatDate } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification, PagedResponse } from "@/types";

const typeIcons: Record<Notification["type"], typeof Bell> = {
  NewOrder: ShoppingBag,
  PaymentProofSubmitted: Receipt,
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () =>
      api
        .get<PagedResponse<Notification>>("/notifications", {
          params: { page: 1, pageSize: 50 },
        })
        .then((r) => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      qc.invalidateQueries({ queryKey: ["admin-notifications-unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      qc.invalidateQueries({ queryKey: ["admin-notifications-unread-count"] });
    },
  });

  const hasUnread = data?.data.some((n) => !n.isRead) ?? false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Bildirishnomalar</h1>
        {hasUnread && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Barchasini o&apos;qilgan qilish
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && <ErrorState message="Bildirishnomalar yuklanmadi" onRetry={refetch} />}

      {data && data.data.length === 0 && (
        <div className="rounded-xl border bg-card p-8 flex flex-col items-center gap-3 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium">Bildirishnomalar yo&apos;q</p>
          <p className="text-sm text-muted-foreground">
            Yangi buyurtmalar haqida shu yerda va Telegram orqali xabar olasiz.
            <br />
            Sozlamalar sahifasidan Telegram Chat ID ni ulang.
          </p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <div className="space-y-2">
          {data.data.map((n) => {
            const Icon = typeIcons[n.type] ?? Bell;
            const content = (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm",
                  !n.isRead && "border-primary/40 bg-primary/5"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    n.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            );

            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markReadMutation.mutate(n.id);
                }}
                className="cursor-pointer"
              >
                {n.orderId ? (
                  <Link href={`/admin/orders/${n.orderId}`}>{content}</Link>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
