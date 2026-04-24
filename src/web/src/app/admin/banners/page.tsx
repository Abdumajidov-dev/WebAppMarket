"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ImagePlus, Image as ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse, Banner } from "@/types";

const GRADIENTS = [
  { label: "Binafsha", value: "from-[#7B2FF7] to-[#4A00E0]" },
  { label: "Qizil", value: "from-[#FF3B30] to-[#FF6B6B]" },
  { label: "To'q sariq", value: "from-[#FF9500] to-[#FFCC02]" },
  { label: "Yashil", value: "from-[#34C759] to-[#30D158]" },
  { label: "Ko'k", value: "from-[#007AFF] to-[#5AC8FA]" },
  { label: "Qoʻngʻir", value: "from-[#FF6B35] to-[#F7C59F]" },
];

interface BannerFormData {
  title: string;
  subtitle: string;
  emoji: string;
  linkUrl: string;
  bgGradient: string;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminBannersPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingUploadId, setPendingUploadId] = useState<string | null>(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: () =>
      api.get<ApiResponse<Banner[]>>("/banners").then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<BannerFormData>({ defaultValues: { bgGradient: GRADIENTS[0].value, sortOrder: 0, isActive: true } });

  const selectedGradient = watch("bgGradient");

  const createMutation = useMutation({
    mutationFn: (data: BannerFormData) =>
      api.post<ApiResponse<{ id: string }>>("/banners", {
        title: data.title,
        subtitle: data.subtitle || null,
        emoji: data.emoji || null,
        linkUrl: data.linkUrl || null,
        bgGradient: data.bgGradient,
        sortOrder: Number(data.sortOrder),
        isActive: data.isActive,
      }),
    onSuccess: () => {
      toast.success("Banner qo'shildi");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
      closeModal();
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: BannerFormData & { id: string }) =>
      api.put(`/banners/${data.id}`, {
        id: data.id,
        title: data.title,
        subtitle: data.subtitle || null,
        emoji: data.emoji || null,
        linkUrl: data.linkUrl || null,
        bgGradient: data.bgGradient,
        sortOrder: Number(data.sortOrder),
        isActive: data.isActive,
      }),
    onSuccess: () => {
      toast.success("Banner yangilandi");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
      closeModal();
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/banners/${id}`),
    onSuccess: () => {
      toast.success("Banner o'chirildi");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  async function handleImageUpload(bannerId: string, file: File) {
    setUploadingId(bannerId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/banners/${bannerId}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Rasm yuklandi");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
    } catch {
      toast.error("Rasm yuklashda xatolik");
    } finally {
      setUploadingId(null);
      setPendingUploadId(null);
    }
  }

  function openCreate() {
    setEditing(null);
    reset({ title: "", subtitle: "", emoji: "", linkUrl: "", bgGradient: GRADIENTS[0].value, sortOrder: banners.length, isActive: true });
    setModalOpen(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    reset({ title: b.title, subtitle: b.subtitle ?? "", emoji: b.emoji ?? "", linkUrl: b.linkUrl ?? "", bgGradient: b.bgGradient, sortOrder: b.sortOrder, isActive: b.isActive });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function onSubmit(data: BannerFormData) {
    if (editing) updateMutation.mutate({ ...data, id: editing.id });
    else createMutation.mutate(data);
  }

  function confirmDelete(b: Banner) {
    if (window.confirm(`"${b.title}" bannerni o'chirmoqchimisiz?`))
      deleteMutation.mutate(b.id);
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pendingUploadId) handleImageUpload(pendingUploadId, file);
          e.target.value = "";
        }}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Bannerlar</h1>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Qo&apos;shish
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
          <ImageIcon className="mb-3 h-10 w-10 opacity-30" />
          <p className="font-medium">Banner yo&apos;q</p>
          <p className="mt-1 text-sm">Yangi banner qo&apos;shing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="rounded-2xl border bg-card overflow-hidden">
              <div className={`bg-gradient-to-r ${b.bgGradient} px-4 py-3 flex items-center gap-3`}>
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <span className="text-3xl shrink-0">{b.emoji || "🖼️"}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{b.title}</p>
                  {b.subtitle && <p className="text-xs text-white/80 truncate">{b.subtitle}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${b.isActive ? "bg-white/20 text-white" : "bg-black/20 text-white/60"}`}>
                  {b.isActive ? "Faol" : "Yashirin"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
                <button
                  onClick={() => { setPendingUploadId(b.id); fileRef.current?.click(); }}
                  disabled={uploadingId === b.id}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  {uploadingId === b.id ? "Yuklanmoqda..." : "Rasm"}
                </button>
                <span className="text-xs text-muted-foreground">{b.linkUrl ? `→ ${b.linkUrl}` : ""}</span>
                <div className="flex-1" />
                <button onClick={() => openEdit(b)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => confirmDelete(b)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">{editing ? "Bannerni tahrirlash" : "Yangi banner"}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1">
                <Label>Sarlavha *</Label>
                <Input placeholder="Yangi kolleksiya" {...register("title", { required: "Sarlavha shart" })} aria-invalid={!!errors.title} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Qo&apos;shimcha matn</Label>
                <Input placeholder="30% chegirma" {...register("subtitle")} />
              </div>
              <div className="space-y-1">
                <Label>Emoji (rasm yuklanmasa)</Label>
                <Input placeholder="👗" {...register("emoji")} />
              </div>
              <div className="space-y-1">
                <Label>Havola (ixtiyoriy)</Label>
                <Input placeholder="/catalog?category=ayollar" {...register("linkUrl")} />
              </div>
              <div className="space-y-1">
                <Label>Fon rangi</Label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENTS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setValue("bgGradient", g.value)}
                      className={`h-10 rounded-xl bg-gradient-to-r ${g.value} text-xs text-white font-medium transition-all ${selectedGradient === g.value ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tartib</Label>
                  <Input type="number" min={0} {...register("sortOrder", { valueAsNumber: true })} />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input type="checkbox" id="isActive" {...register("isActive")} className="h-4 w-4" />
                  <Label htmlFor="isActive">Faol</Label>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>Bekor</Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
