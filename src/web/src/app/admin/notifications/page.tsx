"use client";

import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Bildirishnomalar</h1>
      <div className="rounded-xl border bg-card p-8 flex flex-col items-center gap-3 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/40" />
        <p className="font-medium">Bildirishnomalar yo&apos;q</p>
        <p className="text-sm text-muted-foreground">
          Yangi buyurtmalar haqida Telegram orqali xabar olasiz.
          <br />
          Sozlamalar sahifasidan Telegram Chat ID ni ulang.
        </p>
      </div>
    </div>
  );
}
