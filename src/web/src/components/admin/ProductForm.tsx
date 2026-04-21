"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiResponse, Category, ProductDetail, ProductImage } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Kamida 2 harf"),
  price: z.number().positive("Narx musbat bo'lsin"),
  discountPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0, "0 dan kam bo'lmaydi"),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface ProductFormProps {
  product?: ProductDetail;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<ApiResponse<Category[]>>("/categories").then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      price: product?.price ?? 0,
      discountPrice: product?.discountPrice ?? undefined,
      stockQuantity: product?.stockQuantity ?? 0,
      categoryId: product?.categoryId ?? "",
      description: product?.description ?? "",
      isActive: product?.isActive ?? true,
    },
  });

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const payload = {
        ...data,
        discountPrice: data.discountPrice ?? null,
        categoryId: data.categoryId || null,
      };

      if (product) {
        await api.put(`/products/${product.id}`, payload);
        toast.success("Mahsulot yangilandi");
      } else {
        await api.post("/products", payload);
        toast.success("Mahsulot qo'shildi");
      }
      router.push("/admin/products");
    } catch {
      toast.error("Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(files: FileList) {
    if (!product) {
      toast.error("Avval mahsulotni saqlang, keyin rasm qo'shing");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    for (const file of Array.from(files)) {
      if (!allowed.includes(file.type)) {
        toast.error("Faqat JPG, PNG, WebP");
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: 5MB dan oshmasligi kerak`);
        continue;
      }
      setUploading(true);
      try {
        const form = new FormData();
        form.append("image", file);
        const res = await api.post<ApiResponse<ProductImage>>(
          `/products/${product.id}/images`,
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setImages((prev) => [...prev, res.data.data]);
      } catch {
        toast.error("Rasm yuklanmadi");
      } finally {
        setUploading(false);
      }
    }
  }

  async function deleteImage(imageId: string) {
    if (!product) return;
    try {
      await api.delete(`/products/${product.id}/images/${imageId}`);
      setImages((prev) => prev.filter((i) => i.id !== imageId));
      toast.success("Rasm o'chirildi");
    } catch {
      toast.error("O'chirishda xatolik");
    }
  }

  const flatCategories = flattenCategories(categoriesData ?? []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Basic info */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Asosiy ma&apos;lumotlar</h2>

        <div className="space-y-1">
          <Label htmlFor="name">Nomi *</Label>
          <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="price">Narxi (so&apos;m) *</Label>
            <Input
              id="price"
              type="number"
              inputMode="numeric"
              {...register("price", { valueAsNumber: true })}
              aria-invalid={!!errors.price}
            />
            {errors.price && (
              <p className="text-xs text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="discountPrice">Chegirma narxi</Label>
            <Input
              id="discountPrice"
              type="number"
              inputMode="numeric"
              placeholder="ixtiyoriy"
              {...register("discountPrice", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="stockQuantity">Zaxira (dona) *</Label>
          <Input
            id="stockQuantity"
            type="number"
            inputMode="numeric"
            {...register("stockQuantity", { valueAsNumber: true })}
            aria-invalid={!!errors.stockQuantity}
          />
          {errors.stockQuantity && (
            <p className="text-xs text-destructive">{errors.stockQuantity.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="categoryId">Kategoriya</Label>
          <select
            id="categoryId"
            {...register("categoryId")}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          >
            <option value="">— Kategoriyasiz —</option>
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.indent}
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">Tavsif</Label>
          <textarea
            id="description"
            rows={4}
            placeholder="Mahsulot haqida..."
            {...register("description")}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 resize-none"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register("isActive")} className="accent-primary" />
          <span className="text-sm">Faol (do&apos;konda ko&apos;rinadi)</span>
        </label>
      </div>

      {/* Images — only if editing existing product */}
      {product && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Rasmlar</h2>

          <div className="flex flex-wrap gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative h-20 w-20 overflow-hidden rounded-lg bg-muted"
              >
                <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                {img.isPrimary && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-center text-[9px] text-white">
                    Asosiy
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => deleteImage(img.id)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              <Upload className="h-6 w-6" />
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleImageUpload(e.target.files);
            }}
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP — max 5MB. Birinchi rasm asosiy bo&apos;ladi.
          </p>
        </div>
      )}

      {!product && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Rasm qo&apos;shish uchun mahsulotni saqlang, keyin tahrirlash sahifasidan rasm
          yuklang.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saqlanmoqda..." : product ? "Saqlash" : "Qo'shish"}
      </Button>
    </form>
  );
}

function flattenCategories(
  cats: Category[],
  depth = 0
): { id: string; name: string; indent: string }[] {
  const result: { id: string; name: string; indent: string }[] = [];
  for (const c of cats) {
    result.push({ id: c.id, name: c.name, indent: "  ".repeat(depth) });
    if (c.children?.length) {
      result.push(...flattenCategories(c.children, depth + 1));
    }
  }
  return result;
}
