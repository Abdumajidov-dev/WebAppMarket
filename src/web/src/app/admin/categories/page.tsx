"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronRight, FolderOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse, Category } from "@/types";

interface CategoryFormData {
  name: string;
  parentId: string;
  sortOrder: number;
}

function flattenCategories(cats: Category[], depth = 0): { cat: Category; depth: number }[] {
  const result: { cat: Category; depth: number }[] = [];
  for (const cat of cats) {
    result.push({ cat, depth });
    if (cat.children?.length) {
      result.push(...flattenCategories(cat.children, depth + 1));
    }
  }
  return result;
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<ApiResponse<Category[]>>("/categories").then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({ defaultValues: { sortOrder: 0 } });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      api.post("/categories", {
        name: data.name,
        parentId: data.parentId || null,
        sortOrder: Number(data.sortOrder),
      }),
    onSuccess: () => {
      toast.success("Kategoriya qo'shildi");
      qc.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CategoryFormData & { id: string }) =>
      api.put(`/categories/${data.id}`, {
        id: data.id,
        name: data.name,
        parentId: data.parentId || null,
        sortOrder: Number(data.sortOrder),
      }),
    onSuccess: () => {
      toast.success("Kategoriya yangilandi");
      qc.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success("Kategoriya o'chirildi");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  function openCreate() {
    setEditing(null);
    reset({ name: "", parentId: "", sortOrder: 0 });
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    reset({ name: cat.name, parentId: cat.parentId ?? "", sortOrder: cat.sortOrder });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    reset({ name: "", parentId: "", sortOrder: 0 });
  }

  function onSubmit(data: CategoryFormData) {
    if (editing) {
      updateMutation.mutate({ ...data, id: editing.id });
    } else {
      createMutation.mutate(data);
    }
  }

  function confirmDelete(cat: Category) {
    if (window.confirm(`"${cat.name}" kategoriyasini o'chirmoqchimisiz?`)) {
      deleteMutation.mutate(cat.id);
    }
  }

  const flat = flattenCategories(categories);
  const isPending = createMutation.isPending || updateMutation.isPending;

  // All top-level categories for parent selector
  const allFlat = flattenCategories(categories);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Kategoriyalar</h1>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Qo&apos;shish
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : flat.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
          <FolderOpen className="mb-3 h-10 w-10 opacity-30" />
          <p className="font-medium">Kategoriya yo&apos;q</p>
          <p className="mt-1 text-sm">Yangi kategoriya qo&apos;shing</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y overflow-hidden">
          {flat.map(({ cat, depth }) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
            >
              {depth > 0 && (
                <div className="flex items-center text-muted-foreground" style={{ paddingLeft: `${(depth - 1) * 12}px` }}>
                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                </div>
              )}
              {depth === 0 && <div className="w-4 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.slug}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {cat.children?.length ? `${cat.children.length} ta` : ""}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(cat)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => confirmDelete(cat)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold">
              {editing ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label>Nomi</Label>
                <Input
                  placeholder="Masalan: Ayollar kiyimi"
                  {...register("name", { required: "Nom kiritish shart" })}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Parent kategoriya (ixtiyoriy)</Label>
                <select
                  {...register("parentId")}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Yo&apos;q (asosiy kategoriya) —</option>
                  {allFlat
                    .filter(({ cat }) => !editing || cat.id !== editing.id)
                    .map(({ cat, depth }) => (
                      <option key={cat.id} value={cat.id}>
                        {"—".repeat(depth)} {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Tartib raqami</Label>
                <Input
                  type="number"
                  min={0}
                  {...register("sortOrder", { valueAsNumber: true })}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Bekor
                </Button>
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
